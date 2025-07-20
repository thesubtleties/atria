# api/services/email.py
"""
Email service with pluggable backends for sending transactional emails.
Supports both synchronous and asynchronous sending strategies.
"""

from abc import ABC, abstractmethod
from threading import Thread
from typing import Dict, Any, Optional
import logging
import requests
from flask import current_app
from jinja2 import Environment, FileSystemLoader, Template
import os
from datetime import datetime

logger = logging.getLogger(__name__)


class EmailBackend(ABC):
    """Abstract base class for email backends"""
    
    @abstractmethod
    def send(self, to: str, subject: str, template_name: str, context: Dict[str, Any]) -> None:
        """Send an email using the backend implementation"""
        pass


class ThreadedEmailBackend(EmailBackend):
    """Email backend that sends emails in a separate thread"""
    
    def send(self, to: str, subject: str, template_name: str, context: Dict[str, Any]) -> None:
        """Send email asynchronously using threading"""
        # Capture the current app instance and config values before threading
        from flask import current_app
        app = current_app._get_current_object()
        smtp2go_api_key = current_app.config.get('SMTP2GO_API_KEY')
        mail_sender = current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@atria.app')
        
        thread = Thread(
            target=self._send_sync,
            args=(to, subject, template_name, context, app, smtp2go_api_key, mail_sender),
            daemon=True
        )
        thread.start()
        logger.info(f"Email queued for {to} with subject: {subject}")
    
    def _send_sync(self, to: str, subject: str, template_name: str, context: Dict[str, Any], 
                   app, smtp2go_api_key: str, mail_sender: str) -> None:
        """Synchronous email sending via SMTP2GO API"""
        with app.app_context():
            try:
                # Load and render template
                template_env = Environment(
                    loader=FileSystemLoader('api/email_templates'),
                    autoescape=True
                )
                template = template_env.get_template(template_name)
                html_body = template.render(**context)
                
                # Strip HTML for text version (basic approach)
                import re
                text_body = re.sub('<[^<]+?>', '', html_body)
                
                # Send via SMTP2GO API
                response = requests.post(
                    'https://api.smtp2go.com/v3/email/send',
                    headers={
                        'X-Smtp2go-Api-Key': smtp2go_api_key,
                        'Content-Type': 'application/json'
                    },
                    json={
                        'sender': mail_sender,
                        'to': [to],
                        'subject': subject,
                        'html_body': html_body,
                        'text_body': text_body
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    logger.info(f"Email sent successfully to {to}")
                else:
                    logger.error(f"Email send failed: {response.status_code} - {response.text}")
                    
            except Exception as e:
                logger.error(f"Email send error to {to}: {str(e)}")


class CeleryEmailBackend(EmailBackend):
    """Email backend that uses Celery for async processing"""
    
    def send(self, to: str, subject: str, template_name: str, context: Dict[str, Any]) -> None:
        """Queue email for sending via Celery"""
        try:
            from api.tasks.email_tasks import send_email_task
            send_email_task.delay(to, subject, template_name, context)
            logger.info(f"Email queued via Celery for {to}")
        except ImportError:
            logger.error("Celery not configured, falling back to threaded backend")
            # Fallback to threaded backend
            ThreadedEmailBackend().send(to, subject, template_name, context)


class EmailService:
    """Main email service that delegates to configured backend"""
    
    def __init__(self):
        self._backend: Optional[EmailBackend] = None
    
    @property
    def backend(self) -> EmailBackend:
        """Lazy initialization of email backend based on config"""
        if self._backend is None:
            use_celery = current_app.config.get('USE_CELERY', False)
            if use_celery:
                self._backend = CeleryEmailBackend()
            else:
                self._backend = ThreadedEmailBackend()
        return self._backend
    
    def send_event_invitation(
        self,
        email: str,
        event: 'Event',
        role: str,
        invitation_token: str,
        inviter: 'User',
        has_account: bool = False
    ) -> None:
        """Send event invitation email"""
        context = {
            'event_title': event.title,
            'event_description': event.description,
            'event_start_date': event.start_date.strftime('%B %d, %Y'),
            'event_end_date': event.end_date.strftime('%B %d, %Y'),
            'company_name': event.company_name,
            'role': role.replace('_', ' ').title(),
            'invitation_url': f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/invitations/{invitation_token}",
            'inviter_name': inviter.full_name,
            'has_account': has_account,
            'current_year': datetime.utcnow().year
        }
        
        template = 'event_invitation_existing.html' if has_account else 'event_invitation_new.html'
        subject = f"You're invited to {event.title}"
        
        self.backend.send(email, subject, template, context)
    
    def send_connection_request(
        self,
        requester: 'User',
        recipient: 'User',
        icebreaker_message: str,
        event: Optional['Event'] = None
    ) -> None:
        """Send connection request notification"""
        context = {
            'requester_name': requester.full_name,
            'requester_title': requester.title or 'Attendee',
            'requester_company': requester.company_name,
            'icebreaker_message': icebreaker_message,
            'event_title': event.title if event else None,
            'accept_url': f"{current_app.config.get('FRONTEND_URL')}/connections",
            'current_year': datetime.utcnow().year
        }
        
        subject = f"{requester.full_name} wants to connect with you"
        if event:
            subject += f" at {event.title}"
        
        self.backend.send(
            recipient.email,
            subject,
            'connection_request.html',
            context
        )
    
    def send_password_reset(self, user: 'User', reset_token: str) -> None:
        """Send password reset email"""
        context = {
            'user_name': user.first_name,
            'reset_url': f"{current_app.config.get('FRONTEND_URL')}/reset-password/{reset_token}",
            'expires_in': '1 hour',
            'current_year': datetime.utcnow().year
        }
        
        self.backend.send(
            user.email,
            'Reset your Atria password',
            'password_reset.html',
            context
        )
    
    def send_event_reminder(
        self,
        user: 'User',
        event: 'Event',
        hours_until_start: int
    ) -> None:
        """Send event reminder email"""
        context = {
            'user_name': user.first_name,
            'event_title': event.title,
            'event_start_time': event.first_session_time,
            'hours_until_start': hours_until_start,
            'event_url': f"{current_app.config.get('FRONTEND_URL')}/events/{event.slug}",
            'current_year': datetime.utcnow().year
        }
        
        subject = f"Reminder: {event.title} starts in {hours_until_start} hours"
        
        self.backend.send(
            user.email,
            subject,
            'event_reminder.html',
            context
        )


# Global instance
email_service = EmailService()
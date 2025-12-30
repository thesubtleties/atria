from api.extensions import db
from api.models.enums import SessionType, SessionStatus, SessionSpeakerRole, SessionChatMode, StreamingPlatform
from datetime import datetime, timezone, time, date, timedelta


class Session(db.Model):
    __tablename__ = "sessions"

    id = db.Column(db.BigInteger, primary_key=True)
    event_id = db.Column(
        db.BigInteger,
        db.ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    status = db.Column(db.Enum(SessionStatus), nullable=False)
    session_type = db.Column(db.Enum(SessionType), nullable=False)
    chat_mode = db.Column(
        db.Enum(SessionChatMode), 
        nullable=False, 
        default=SessionChatMode.ENABLED
    )
    title = db.Column(db.Text, nullable=False)
    short_description = db.Column(db.String(200))  # For agenda view, max 200 chars
    description = db.Column(db.Text)  # Full description for session detail page
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    stream_url = db.Column(db.Text)

    # Streaming platform fields (multi-platform support: Vimeo/Mux/Zoom/Jitsi/Other)
    # Uses VARCHAR with CHECK constraint (not native ENUM) for flexibility
    streaming_platform = db.Column(db.String(20), nullable=True)
    zoom_meeting_id = db.Column(db.String(255), nullable=True)  # Normalized Zoom URL
    zoom_passcode = db.Column(db.String(100), nullable=True)
    mux_playback_policy = db.Column(db.String(20), nullable=True)  # 'PUBLIC' or 'SIGNED'
    jitsi_room_name = db.Column(db.String(255), nullable=True)  # JaaS room identifier
    # Note: OTHER platform uses stream_url (same as VIMEO/MUX) - no separate column needed

    # Visibility window override (in minutes before/after session times)
    # NULL = use event default, 0 = always on, 5/10/15/30 = minutes
    visibility_minutes_override = db.Column(db.Integer, nullable=True)

    # VOD (Video on Demand) for post-session playback
    vod_url = db.Column(db.Text, nullable=True)
    vod_platform = db.Column(db.String(20), nullable=True)  # VIMEO, MUX, OTHER

    # Stream mode and visibility toggles
    # stream_mode: 'NONE' (no video), 'LIVE' (live stream), 'VOD' (pre-recorded)
    # NULL = backward compat (infer from streaming_platform)
    stream_mode = db.Column(db.String(10), nullable=True)
    show_video = db.Column(db.Boolean, default=True, nullable=False)  # Master toggle
    show_recording = db.Column(db.Boolean, default=True, nullable=False)  # Recording after live

    day_number = db.Column(db.BigInteger, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), onupdate=db.func.current_timestamp()
    )

    # Relationships
    event = db.relationship("Event", foreign_keys=[event_id], back_populates="sessions")
    speakers = db.relationship(
        "User",
        secondary="session_speakers",
        back_populates="speaking_sessions",
        overlaps="session_speakers",
    )
    session_speakers = db.relationship(
        "SessionSpeaker",
        back_populates="session",
        overlaps="speakers,speaking_sessions",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    chat_rooms = db.relationship(
        "ChatRoom",
        back_populates="session",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        db.Index('idx_sessions_event_day_time', 'event_id', 'day_number', 'start_time'),
    )

    def __repr__(self):
        return (
            f"Session(id={self.id}, "
            f"title='{self.title}', "
            f"day={self.day_number}, "
            f"time={self.start_time}-{self.end_time})"
        )

    def get_datetime_for_time(self, time_obj: time) -> datetime:
        """Convert time to full datetime in event timezone"""
        import pytz

        event_start_date = self.event.start_date
        session_date = event_start_date + timedelta(days=self.day_number - 1)

        # Create naive datetime
        naive_dt = datetime.combine(session_date, time_obj)

        # Localize to event timezone (makes it timezone-aware)
        event_tz = pytz.timezone(self.event.timezone)
        return event_tz.localize(naive_dt)

    def validate_times(self):
        """Validate session times"""
        # Check time order
        if self.end_time <= self.start_time:
            raise ValueError("End time must be after start time")

        # Check if day number is valid
        if hasattr(self, "event") and self.event:
            event_duration = (
                self.event.end_date - self.event.start_date
            ).days + 1
            if self.day_number < 1 or self.day_number > event_duration:
                raise ValueError(
                    f"Day number must be between 1 and {event_duration}"
                )

    def update_times(self, new_start_time: time, new_end_time: time):
        """Update both times together safely."""
        if new_end_time <= new_start_time:
            raise ValueError("End time must be after start time")

        with db.session.begin_nested():
            self.start_time = new_start_time
            self.end_time = new_end_time

    def add_speaker(self, user, role=SessionSpeakerRole.SPEAKER, order=None):
        """Add speaker with role to session"""
        from api.models import SessionSpeaker

        if user in self.speakers:
            raise ValueError("Already a speaker for this session")

        speaker = SessionSpeaker(
            session_id=self.id, user_id=user.id, role=role, order=order
        )
        db.session.add(speaker)

        # Not adding speaker to event because our speaker list will only
        # contain those registered to event as speaker.

        return speaker

    def remove_speaker(self, user):
        """Remove speaker from session"""
        from api.models import SessionSpeaker

        SessionSpeaker.query.filter_by(
            session_id=self.id, user_id=user.id
        ).delete()

    def update_status(self, new_status: SessionStatus):
        """
        Update session status with hooks but without strict validation.
        Allows any transition for flexibility in emergency situations.
        """

        with db.session.begin_nested():
            self.status = new_status

            transition_method = f"_on_transition_to_{new_status.value}"
            if hasattr(self, transition_method):
                getattr(self, transition_method)()

    def mark_starting_soon(self):
        """Mark session as starting soon"""
        self.update_status(SessionStatus.STARTING_SOON)

    def start_session(self):
        """Start the session"""
        self.update_status(SessionStatus.LIVE)

    def complete_session(self):
        """Complete the session"""
        self.update_status(SessionStatus.COMPLETED)

    def cancel_session(self):
        """Cancel the session"""
        self.update_status(SessionStatus.CANCELLED)

    @property
    def start_datetime(self) -> datetime:
        """Get full start datetime"""
        return self.get_datetime_for_time(self.start_time)

    @property
    def end_datetime(self) -> datetime:
        """Get full end datetime"""
        return self.get_datetime_for_time(self.end_time)

    @property
    def is_live(self) -> bool:
        return self.status == SessionStatus.LIVE

    @property
    def is_completed(self) -> bool:
        return self.status == SessionStatus.COMPLETED

    @property
    def is_cancelled(self) -> bool:
        return self.status == SessionStatus.CANCELLED

    @property
    def duration_minutes(self):
        """Get session duration in minutes"""
        start_minutes = self.start_time.hour * 60 + self.start_time.minute
        end_minutes = self.end_time.hour * 60 + self.end_time.minute
        return end_minutes - start_minutes

    @property
    def is_upcoming(self):
        """Check if session is upcoming"""
        return (
            self.status == SessionStatus.SCHEDULED
            and self.start_datetime > datetime.now(timezone.utc)
        )

    @property
    def is_in_progress(self):
        """Check if session is currently running"""
        now = datetime.now(timezone.utc)
        return (
            self.status == SessionStatus.LIVE
            and self.start_datetime <= now <= self.end_datetime
        )

    @property
    def formatted_duration(self) -> str:
        """Get human-readable duration"""
        minutes = self.duration_minutes
        hours = minutes // 60
        remaining_minutes = minutes % 60
        return f"{hours}h {remaining_minutes}m"

    def has_speaker(self, user):
        """Check if user is a speaker"""
        return user in self.speakers

    @property
    def public_chat_room(self):
        """Get the public chat room for this session"""
        from api.models.enums import ChatRoomType
        return next((room for room in self.chat_rooms if room.room_type == ChatRoomType.PUBLIC), None)
    
    @property
    def backstage_chat_room(self):
        """Get the backstage chat room for this session"""
        from api.models.enums import ChatRoomType
        return next((room for room in self.chat_rooms if room.room_type == ChatRoomType.BACKSTAGE), None)
    
    @property
    def has_chat_enabled(self):
        """Check if any chat is enabled for this session"""
        return self.chat_mode != SessionChatMode.DISABLED
    
    @property
    def has_public_chat_enabled(self):
        """Check if public chat is enabled for this session"""
        return self.chat_mode == SessionChatMode.ENABLED
    
    @property
    def has_backstage_chat_enabled(self):
        """Check if backstage chat is enabled for this session"""
        return self.chat_mode in [SessionChatMode.ENABLED, SessionChatMode.BACKSTAGE_ONLY]

    # Visibility Window Properties
    @property
    def effective_visibility_minutes(self) -> int | None:
        """Get the effective visibility window in minutes.

        Returns:
            int: Minutes before/after session time (0 = always on explicitly)
            None: Always on (from NULL event default)
        """
        # Session override takes priority
        if self.visibility_minutes_override is not None:
            return self.visibility_minutes_override if self.visibility_minutes_override > 0 else None
        # Fall back to event default
        if self.event and self.event.session_visibility_minutes is not None:
            return self.event.session_visibility_minutes if self.event.session_visibility_minutes > 0 else None
        # Default: always on
        return None

    @property
    def window_opens_at(self) -> datetime | None:
        """Get datetime when visibility window opens, or None if always open."""
        minutes = self.effective_visibility_minutes
        if minutes is None:
            return None
        return self.start_datetime - timedelta(minutes=minutes)

    @property
    def window_closes_at(self) -> datetime | None:
        """Get datetime when visibility window closes, or None if always open."""
        minutes = self.effective_visibility_minutes
        if minutes is None:
            return None
        return self.end_datetime + timedelta(minutes=minutes)

    @property
    def is_window_open(self) -> bool:
        """Check if the session visibility window is currently open."""
        opens_at = self.window_opens_at
        closes_at = self.window_closes_at

        if opens_at is None or closes_at is None:
            return True  # Always on

        now = datetime.now(timezone.utc)
        return opens_at <= now <= closes_at

    @property
    def window_state(self) -> str:
        """Get current window state: 'pre', 'open', or 'post'."""
        if self.effective_visibility_minutes is None:
            return 'open'  # Always on

        now = datetime.now(timezone.utc)

        if now < self.window_opens_at:
            return 'pre'
        elif now > self.window_closes_at:
            return 'post'
        else:
            return 'open'

    @property
    def has_vod(self) -> bool:
        """Check if VOD is available for this session."""
        # Manual VOD URL takes priority
        if self.vod_url:
            return True
        # Vimeo embeds work as VOD after stream ends
        if self.streaming_platform == 'VIMEO' and self.stream_url:
            return True
        # Mux playback IDs work for VOD
        if self.streaming_platform == 'MUX' and self.stream_url:
            return True
        # OTHER platform - use stream_url as recording fallback
        if self.streaming_platform == 'OTHER' and self.stream_url:
            return True
        # Jitsi/Zoom - no automatic VOD (interactive platforms)
        return False

    # Stream Mode Properties
    @property
    def effective_stream_mode(self) -> str:
        """Get effective stream mode (handles NULL backward compat).

        Returns:
            'NONE': No video (in-person event, chat-only)
            'LIVE': Live streaming session
            'VOD': Pre-recorded video session
        """
        if self.stream_mode:
            return self.stream_mode
        # NULL: infer from existing data for backward compat
        if self.streaming_platform:
            return 'LIVE'
        return 'NONE'

    @property
    def is_vod_session(self) -> bool:
        """Is this a VOD-only session (pre-recorded)?"""
        return self.effective_stream_mode == 'VOD'

    @property
    def is_live_session(self) -> bool:
        """Is this a live streaming session?"""
        return self.effective_stream_mode == 'LIVE'

    @property
    def is_no_video_session(self) -> bool:
        """Is this a no-video session (in-person, chat-only)?"""
        return self.effective_stream_mode == 'NONE'

    @property
    def should_show_video(self) -> bool:
        """Should video player be displayed at all?"""
        if not self.show_video or self.is_no_video_session:
            return False
        return bool(self.stream_url) or bool(self.vod_url)

    @property
    def is_past_start_time(self) -> bool:
        """Has the session's scheduled start time passed?"""
        if not self.start_datetime:
            return False
        return datetime.now(timezone.utc) >= self.start_datetime

    @property
    def is_past_end_time(self) -> bool:
        """Has the session's scheduled end time passed?"""
        if not self.end_datetime:
            return False
        return datetime.now(timezone.utc) > self.end_datetime

    @property
    def should_show_recording(self) -> bool:
        """Should recording be shown (for live sessions after end)?

        Only applies to LIVE mode sessions. Returns True if:
        - show_video and show_recording toggles are both True
        - Session is a live session (not VOD or NONE)
        - VOD is available (either vod_url or auto-detect from Vimeo/Mux)
        - Session end time has passed
        """
        if not self.show_video or not self.show_recording:
            return False
        if not self.is_live_session:
            return False
        return self.has_vod and self.is_past_end_time

    @property
    def current_video_state(self) -> str:
        """Get current video state for frontend rendering.

        Returns one of:
            'none': No video configured (NONE mode)
            'hidden': Video explicitly hidden by show_video toggle
            'pre': Before session/window opens
            'live': Live stream is active
            'vod': VOD content is available
            'recording': Post-live recording available
            'ended': Session ended, no recording available
        """
        if self.is_no_video_session:
            return 'none'

        if not self.show_video:
            return 'hidden'

        if self.is_vod_session:
            # VOD: available from start_time onward, evergreen
            if self.is_past_start_time:
                return 'vod'
            return 'pre'

        # Live sessions - check timing regardless of window state
        if self.is_past_end_time:
            # Session has ended - show recording or thank you
            if self.show_recording and self.has_vod:
                return 'recording'
            return 'ended'
        elif not self.is_window_open:
            # Window not open yet (before visibility window)
            return 'pre'
        else:
            # Session is active and window is open
            return 'live'

    def get_speakers_by_role(self, role: SessionSpeakerRole):
        """Get all speakers with specific role"""
        from api.models import SessionSpeaker

        return [
            speaker.user
            for speaker in SessionSpeaker.query.filter_by(
                session_id=self.id, role=role
            ).all()
        ]

    def get_speakers_with_details(self):
        """Get speakers with their roles and details combined"""
        return [
            {
                "id": speaker.id,
                "full_name": speaker.full_name,
                "title": speaker.title,
                "company_name": speaker.company_name,
                "image_url": speaker.image_url,
                "social_links": speaker.social_links,
                "role": next(
                    (
                        ss.role.value
                        for ss in self.session_speakers
                        if ss.user_id == speaker.id
                    ),
                    None,
                ),
            }
            for speaker in self.speakers
        ]

    def has_speaker_conflicts(self, user):
        """Check if speaker has conflicts with other sessions"""
        user_sessions = user.speaking_sessions

        for session in user_sessions:
            if session.id != self.id:  # Don't check against self
                if (
                    session.day_number == self.day_number  # Same day
                    and self.start_time < session.end_time
                    and self.end_time > session.start_time
                ):
                    return True
        return False

    def save(self):
        """Save with validation"""
        self.validate_times()
        db.session.add(self)
        db.session.commit()

    @classmethod
    def get_upcoming(cls, event_id):
        """Get upcoming sessions for event"""
        now = datetime.now(timezone.utc)

        # First get the event
        from api.models import Event

        event = Event.query.get(event_id)
        if not event:
            return []

        # Calculate current day number
        current_day = (now.date() - event.start_date.date()).days + 1
        current_time = now.time()

        return (
            cls.query.filter(
                cls.event_id == event_id,
                cls.status == SessionStatus.SCHEDULED,
                db.or_(
                    cls.day_number > current_day,
                    db.and_(
                        cls.day_number == current_day,
                        cls.start_time > current_time,
                    ),
                ),
            )
            .order_by(cls.day_number, cls.start_time)
            .all()
        )

    @classmethod
    def get_by_day(cls, event_id, day_number):
        """Get all sessions for specific day"""
        return (
            cls.query.filter(
                cls.event_id == event_id, cls.day_number == day_number
            )
            .order_by(cls.start_time)
            .all()
        )

    def get_playback_data(self):
        """
        Generate platform-specific playback data.

        Returns different structure based on streaming platform:
        - VIMEO: Simple URL
        - MUX: URL + optional signed tokens
        - ZOOM: Join URL with embedded passcode

        Returns:
            dict: Platform-specific playback data
        """
        if not self.streaming_platform:
            # No platform configured, return None
            return None

        if self.streaming_platform == 'VIMEO':
            return {
                "platform": "VIMEO",
                "playback_url": self.stream_url,
                "tokens": None
            }

        elif self.streaming_platform == 'MUX':
            from api.services.mux_playback_service import MuxPlaybackService

            # Calculate smart expiration based on session duration
            token_exp = MuxPlaybackService.calculate_session_token_expiration(self)

            # Generate playback URL with tokens if SIGNED
            result = MuxPlaybackService.get_playback_url(
                organization=self.event.organization,
                playback_id=self.stream_url,
                playback_policy=self.mux_playback_policy or 'PUBLIC',
                token_expiration=token_exp
            )

            return {
                "platform": "MUX",
                "playback_url": result["playback_url"],
                "playback_policy": result["playback_policy"],
                "tokens": result["tokens"]
            }

        elif self.streaming_platform == 'ZOOM':
            # Zoom URL already includes passcode in ?pwd= parameter
            return {
                "platform": "ZOOM",
                "join_url": self.zoom_meeting_id,  # Full URL with ?pwd=
                "passcode": self.zoom_passcode  # Separate for optional display
            }

        elif self.streaming_platform == 'JITSI':
            # Generate per-user JaaS JWT token
            # NOTE: If we implement session response caching, move this to a separate
            # GET /sessions/{id}/jaas-token endpoint to keep session data cacheable.
            # This would still provide per-user tokens, just in a second API call.
            from flask_jwt_extended import get_jwt_identity
            from api.models import User
            from api.services.jaas_service import JaaSService

            # Get current user from JWT
            current_user_id = int(get_jwt_identity())
            user = User.query.get(current_user_id)

            if not user:
                return None

            # Determine moderator status (event admins/organizers)
            is_mod = JaaSService.is_user_moderator(user, self)

            # Calculate smart expiration based on session duration
            token_exp = JaaSService.calculate_session_token_expiration(self)

            # Generate JaaS JWT for this specific user
            token_data = JaaSService.generate_token(
                organization=self.event.organization,
                room_name=self.jitsi_room_name,
                user=user,
                is_moderator=is_mod,
                token_expiration=token_exp
            )

            return {
                "platform": "JITSI",
                "app_id": self.event.organization.jaas_app_id,  # Needed by JaaSMeeting component
                "room_name": self.jitsi_room_name,
                "token": token_data["token"],
                "expires_at": token_data["expires_at"]
            }

        elif self.streaming_platform == 'OTHER':
            # External streaming platform URL (MS Teams, self-hosted Jitsi, etc.)
            # Uses stream_url column and playback_url response field (same as VIMEO)
            return {
                "platform": "OTHER",
                "playback_url": self.stream_url
            }

        return None

"""Simple helper to paginate query"""

from typing import Dict, Any, Tuple, Optional, Union
from flask import url_for, request
from marshmallow import Schema, fields

DEFAULT_PAGE_SIZE = 50
DEFAULT_PAGE_NUMBER = 1

# Reusable documentation parameters
PAGINATION_PARAMETERS = [
    {
        "in": "query",
        "name": "page",
        "schema": {"type": "integer"},
        "description": f"Page number (default: {DEFAULT_PAGE_NUMBER})",
    },
    {
        "in": "query",
        "name": "per_page",
        "schema": {"type": "integer"},
        "description": f"Items per page (default: {DEFAULT_PAGE_SIZE})",
    },
]


# Reusable response structure
def get_pagination_schema(collection_name: str, ref_schema: str):
    """Get the pagination response schema for documentation"""
    return {
        "description": f"Paginated list of {collection_name}",
        "content": {
            "application/json": {
                "schema": {
                    "type": "object",
                    "properties": {
                        "total_items": {"type": "integer"},
                        "total_pages": {"type": "integer"},
                        "current_page": {"type": "integer"},
                        "per_page": {"type": "integer"},
                        "self": {"type": "string"},
                        "first": {"type": "string"},
                        "last": {"type": "string"},
                        "next": {"type": "string", "nullable": True},
                        "prev": {"type": "string", "nullable": True},
                        collection_name: {
                            "type": "array",
                            "items": {
                                "$ref": f"#/components/schemas/{ref_schema}"
                            },
                        },
                    },
                }
            }
        },
    }


def create_pagination_schema(item_schema_class, collection_name: str = "items"):
    """
    Create a pagination wrapper schema class for Flask-SMOREST.

    This generates a Marshmallow schema that describes the response structure
    returned by the paginate() function. The schema must be manually registered
    with Flask-SMOREST (see register_pagination_schemas in app.py) to avoid
    double serialization issues.

    Args:
        item_schema_class: The Marshmallow schema class for individual items
        collection_name: The key name for the items array in the response (e.g., "events", "users")

    Returns:
        A Marshmallow Schema class for OpenAPI documentation

    Example:
        # Create the schema
        PaginatedEvents = create_pagination_schema(EventSchema, "events")

        # Register it manually at startup (in app.py)
        api.spec.components.schema('PaginatedEvent', schema=PaginatedEvents)

        # Use in routes (docs only, not for serialization)
        @blp.response(200)
        @blp.doc(responses={200: get_pagination_doc_reference("Event")})
        def get(self, org_id):
            return paginate(query, EventSchema(many=True), "events")
    """
    # Get the schema name for OpenAPI documentation
    # If the schema has a Meta.name, use it; otherwise use the class name
    if hasattr(item_schema_class, 'Meta') and hasattr(item_schema_class.Meta, 'name'):
        item_schema_name = item_schema_class.Meta.name
    else:
        # Remove 'Schema' suffix if present
        item_schema_name = item_schema_class.__name__.replace('Schema', '')

    # Create unique schema class dynamically
    schema_attrs = {
        'total_items': fields.Integer(metadata={'description': 'Total number of items across all pages'}),
        'total_pages': fields.Integer(metadata={'description': 'Total number of pages'}),
        'current_page': fields.Integer(metadata={'description': 'Current page number'}),
        'per_page': fields.Integer(metadata={'description': 'Items per page'}),
        'self': fields.String(metadata={'description': 'Link to current page'}, data_key='self'),
        'first': fields.String(metadata={'description': 'Link to first page'}),
        'last': fields.String(metadata={'description': 'Link to last page'}),
        'next': fields.String(allow_none=True, metadata={'description': 'Link to next page (null if on last page)'}),
        'prev': fields.String(allow_none=True, metadata={'description': 'Link to previous page (null if on first page)'}),
        collection_name: fields.List(
            fields.Nested(item_schema_class),
            metadata={'description': f'Array of {collection_name}'}
        ),
        'Meta': type('Meta', (), {
            'name': f'Paginated{item_schema_name}'
        })
    }

    # Create and return the schema class
    PaginatedSchema = type(
        f'Paginated{item_schema_name}Schema',
        (Schema,),
        schema_attrs
    )

    return PaginatedSchema


def get_pagination_doc_reference(schema_class_name: str):
    """
    Get OpenAPI documentation reference for a paginated response.

    This returns a properly formatted OpenAPI response dict that references
    a PaginatedXYZ schema registered with Flask-SMOREST. Use this in @blp.doc()
    to document paginated endpoints without triggering serialization.

    Args:
        schema_class_name: The base schema name (e.g., "Event", "User", "Organization")
                          This will be prefixed with "Paginated" to match the registered schema

    Returns:
        OpenAPI response dict for use in @blp.doc(responses={...})

    Example:
        @blp.response(200)  # No schema = no serialization
        @blp.doc(
            responses={
                200: get_pagination_doc_reference("Event"),
                404: {"description": "Not found"}
            }
        )
        def get(self, org_id):
            return paginate(query, EventSchema(many=True), "events")
    """
    return {
        "description": f"Paginated response",
        "content": {
            "application/json": {
                "schema": {
                    "$ref": f"#/components/schemas/Paginated{schema_class_name}"
                }
            }
        }
    }


def extract_pagination(
    page: Optional[Union[str, int]] = None,
    per_page: Optional[Union[str, int]] = None,
    **request_args: Any,
) -> Tuple[int, int, Dict[str, Any]]:
    """
    Extract pagination parameters from request arguments
    Returns: Tuple of (page_number, items_per_page, remaining_args)
    """
    try:
        page_number = int(page) if page is not None else DEFAULT_PAGE_NUMBER
        items_per_page = (
            int(per_page) if per_page is not None else DEFAULT_PAGE_SIZE
        )
    except (TypeError, ValueError):
        page_number = DEFAULT_PAGE_NUMBER
        items_per_page = DEFAULT_PAGE_SIZE

    return page_number, items_per_page, request_args


def paginate(query, schema, collection_name: str = "results"):
    """Paginate a query and return formatted response"""
    page, per_page, other_request_args = extract_pagination(**request.args)
    page_obj = query.paginate(page=page, per_page=per_page)

    # Generate all pagination links
    endpoint = request.endpoint
    view_args = request.view_args or {}

    links = {
        "self": url_for(
            endpoint,
            page=page_obj.page,
            per_page=per_page,
            **other_request_args,
            **view_args,
        ),
        "first": url_for(
            endpoint,
            page=1,
            per_page=per_page,
            **other_request_args,
            **view_args,
        ),
        "last": url_for(
            endpoint,
            page=page_obj.pages,
            per_page=per_page,
            **other_request_args,
            **view_args,
        ),
    }

    if page_obj.has_next:
        links["next"] = url_for(
            endpoint,
            page=page_obj.next_num,
            per_page=per_page,
            **other_request_args,
            **view_args,
        )

    if page_obj.has_prev:
        links["prev"] = url_for(
            endpoint,
            page=page_obj.prev_num,
            per_page=per_page,
            **other_request_args,
            **view_args,
        )

    return {
        "total_items": page_obj.total,
        "total_pages": page_obj.pages,
        "current_page": page_obj.page,
        "per_page": per_page,
        **links,
        collection_name: schema.dump(page_obj.items),
    }

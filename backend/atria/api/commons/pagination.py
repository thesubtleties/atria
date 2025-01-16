"""Simple helper to paginate query"""

from typing import Dict, Any, Tuple, Optional, Union
from flask import url_for, request

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

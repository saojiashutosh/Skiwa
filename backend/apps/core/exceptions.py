"""Consistent error envelope: {"detail": str, "errors": {field: [msgs]}}."""
import logging

from rest_framework.views import exception_handler

logger = logging.getLogger("skiwaa")


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        logger.exception("Unhandled API exception", exc_info=exc)
        return None

    data = response.data
    if isinstance(data, dict) and "detail" in data and len(data) == 1:
        return response

    if isinstance(data, list):
        response.data = {"detail": data[0] if data else "Request failed.", "errors": {"non_field_errors": data}}
    elif isinstance(data, dict):
        first_error = next(iter(data.values()), ["Request failed."])
        detail = first_error[0] if isinstance(first_error, list) else str(first_error)
        response.data = {"detail": str(detail), "errors": data}
    return response

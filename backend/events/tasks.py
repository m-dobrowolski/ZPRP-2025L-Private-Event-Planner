import logging

import dramatiq
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def _get_url(kwargs=None) -> str:
    uuid = kwargs.pop('uuid', None)
    edit_uuid = kwargs.pop('edit_uuid', None)
    if uuid:
        if edit_uuid:
            return f'http://localhost/event/{uuid}/{edit_uuid}'
        return f'http://localhost/event/{uuid}'
    return "http://localhost/"

@dramatiq.actor(max_retries=3)
def send_event_invite_email_task(to_email, name, surname, event_details):
    """
    Dramatiq task to send a personalized event invitation email.
    event_details is expected to be a dictionary.
    """
    subject = f"Invitation: {event_details.get('name', 'Our Event')}"
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [to_email]

    context = {
        'name': name,
        'surname': surname,
        'event_name': event_details.get('name'),
        'event_date': event_details.get('date'),
        'event_link': event_details.get('event_link'),
    }

    try:
        text_content = render_to_string('invite_email.txt', context)
        html_content = render_to_string('invite_email.html', context)

        msg = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info("Successfully sent invite via background task to %s", to_email)

    except Exception:
        logger.exception("Error sending email task to %s", to_email)
        raise


@dramatiq.actor(max_retries=3)
def send_event_admin_link_task(creator_email, creator_name, event_name,
                               event_uuid, event_edit_uuid):
    """
    Dramatiq task to send an admin link to an event
    for the event's creator.
    """
    subject = f"Your Event Created: Admin Link for '{event_name}'"
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [creator_email]

    try:
        admin_link = _get_url(kwargs={'uuid': str(event_uuid),
                                      'edit_uuid': str(event_edit_uuid)})
    except Exception:
        logger.exception("Could not get URL for event-admin-detail: %s. \
                         Using fallback.")
        admin_link = f"Please check your event dashboard for event UUID: {event_uuid}"


    context = {
        'creator_name': creator_name,
        'event_name': event_name,
        'admin_link': admin_link,
        'event_uuid': str(event_uuid), # Include UUIDs for reference if link fails
        'event_edit_uuid': str(event_edit_uuid),
    }

    try:
        text_content = render_to_string('event_admin_link.txt', context)
        html_content = render_to_string('event_admin_link.html', context)

        msg = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info("Successfully sent admin link email for '%s' to %s",
                    event_name, creator_email)

    except Exception:
        logger.exception("Error sending admin link email to %s for event '%s'.",
                          creator_email, event_name)
        raise


@dramatiq.actor(max_retries=3)
def send_event_update_notification_task(participant_email, participant_name,
                                        event_name, event_uuid):
    """
    Dramatiq task to send an email notification
    about event changes to participants.
    """
    subject = f"Update: Event Details Changed for '{event_name}'"
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [participant_email]

    try:
        event_link = _get_url(kwargs={'uuid': str(event_uuid)})
    except Exception:
        logger.exception("Could not reverse URL for event-detail. Using fallback.")
        event_link = f"Please check the event page for event UUID: {event_uuid}"

    context = {
        'participant_name': participant_name,
        'event_name': event_name,
        'event_link': event_link, # Link to the public event page
        'event_uuid': str(event_uuid),
    }

    try:
        text_content = render_to_string('event_update_notification.txt', context)
        html_content = render_to_string('event_update_notification.html', context)

        msg = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info("Successfully sent update notification for '%s' to %s",
                    event_name, participant_email)

    except Exception:
        logger.exception(
            "Error sending update notification email to %s for event %s",
            participant_email, event_name,
        )
        raise


@dramatiq.actor(max_retries=3)
def send_event_cancellation_notification_task(participant_email, participant_name,
                                              event_name):
    """Notifies a participant about event cancellation."""
    subject = f"Cancelled: Event '{event_name}' Has Been Cancelled"
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [participant_email]

    context = {
        'participant_name': participant_name,
        'event_name': event_name,
    }

    try:
        text_content = render_to_string('event_cancellation.txt', context)
        html_content = render_to_string('event_cancellation.html', context)

        msg = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info("Successfully sent cancellation notification for '%s' to %s",
                     event_name, participant_email)

    except Exception:
        logger.exception(
            "Error sending cancellation notification email to %s for event '%s'",
            participant_email, event_name,
        )
        raise

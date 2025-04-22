import logging
import dramatiq
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

logger = logging.getLogger(__name__)


def _get_url(view_name: str, kwargs=None) -> str:
    return "<placeholder_url>"

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
        logger.info(f"Successfully sent invite via background task to {to_email}")

    except Exception as e:
        logger.error(f"Error sending email task to {to_email}: {e}", exc_info=True)
        raise


@dramatiq.actor(max_retries=3)
def send_event_admin_link_task(creator_email, creator_name, event_name, event_uuid, event_edit_uuid):
    """
    Dramatiq task to send an admin link to an event
    for the event's creator.
    """
    subject = f"Your Event Created: Admin Link for '{event_name}'"
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [creator_email]

    try:
        admin_link = _get_url('event-admin-detail', kwargs={'uuid': str(event_uuid), 'edit_uuid': str(event_edit_uuid)})
    except Exception as e:
        logger.error(f"Could not get URL for event-admin-detail: {e}. Using fallback.")
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
        logger.info(f"Successfully sent admin link email for '{event_name}' to {creator_email}")

    except Exception as e:
        logger.error(f"Error sending admin link email to {creator_email} for event '{event_name}': {e}", exc_info=True)
        raise


@dramatiq.actor(max_retries=3)
def send_event_update_notification_task(participant_email, participant_name, event_name, event_uuid):
    """
    Dramatiq task to send an email notification
    about event changes to participants
    """
    subject = f"Update: Event Details Changed for '{event_name}'"
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [participant_email]

    try:
        event_link = _get_url('event-detail', kwargs={'uuid': str(event_uuid)})
    except Exception as e:
        logger.error(f"Could not reverse URL for event-detail: {e}. Using fallback.")
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
        logger.info(f"Successfully sent update notification for '{event_name}' to {participant_email}")

    except Exception as e:
        logger.error(f"Error sending update notification email to {participant_email} for event '{event_name}': {e}", exc_info=True)
        raise


@dramatiq.actor(max_retries=3)
def send_event_cancellation_notification_task(participant_email, participant_name, event_name):
    """
    Notifies a participant about event cancellation.
    """
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
        logger.info(f"Successfully sent cancellation notification for '{event_name}' to {participant_email}")

    except Exception as e:
        logger.error(f"Error sending cancellation notification email to {participant_email} for event '{event_name}': {e}", exc_info=True)
        raise
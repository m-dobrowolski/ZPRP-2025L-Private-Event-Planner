import logging

import dramatiq
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

logger = logging.getLogger(__name__)
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
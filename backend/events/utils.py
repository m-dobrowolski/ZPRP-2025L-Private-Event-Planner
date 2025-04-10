import ics
from .models import Event, Participant

def event_to_ics(event: Event):
    calendar = ics.Calendar()
    event_ics = ics.Event(
        name=event.name,
        begin=event.start_datetime,
        end=event.end_datetime,
        description=event.description,
        location=event.location,
        url=event.link,
        uid=str(event.uuid),
        attendees=[
            participant_to_ics_atendee(participant)
            for participant in event.participants.all()
        ],
        organizer=ics.Organizer(
            email=event.organizer_email,
            common_name=event.organizer_name,
        )
    )
    calendar.events.add(event_ics)
    return calendar.serialize()

def participant_to_ics_atendee(participant: Participant):
    atendee = ics.Attendee(
        email=participant.email,
        common_name=participant.name,
    )
    return atendee

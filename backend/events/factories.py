import factory
import random
from .models import Event, Invitation, PersonalizedInvitation, Participant, Comment
from django.utils import timezone
from datetime import timedelta

class EventFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Event

    name = factory.Faker('sentence', nb_words=3)
    location = factory.Faker('address')
    start_datetime = factory.LazyFunction(lambda: timezone.now() + timezone.timedelta(days=7))
    organizer_email = factory.Faker('email')
    description = factory.Faker('text', max_nb_chars=200)
    link = factory.Faker('url')
    organizer_name = factory.Faker('name')
    participants_limit = factory.Faker('random_int', min=1, max=100)

    @factory.lazy_attribute
    def end_datetime(self):
        hours = random.randint(12, 128)
        return self.start_datetime + timedelta(hours=hours)


class ParticipantFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Participant

    event = factory.SubFactory(EventFactory)
    name = factory.Faker('name')
    email = factory.Faker('email')


class InvitationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Invitation

    event = factory.SubFactory(EventFactory)


class PersonalizedInvitationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PersonalizedInvitation

    event = factory.SubFactory(EventFactory)
    name = factory.Faker('name')


class CommentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Comment

    event = factory.SubFactory(EventFactory)
    author = factory.SubFactory(ParticipantFactory)
    content = factory.Faker('text', max_nb_chars=200)

    @factory.lazy_attribute
    def parent(self):
        if random.choice([True, False]):
            return CommentFactory(event=self.event)
        return None

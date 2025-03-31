from .models import Event, Participant
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.db import transaction

class EventCreateSerializer(serializers.Serializer):
    name = serializers.CharField()
    location = serializers.CharField()
    start_datetime = serializers.DateTimeField()
    end_datetime = serializers.DateTimeField()
    organizer_email = serializers.EmailField()
    description = serializers.CharField(required=False, allow_blank=True)
    link = serializers.URLField(required=False, allow_blank=True)
    image = serializers.ImageField(required=False, allow_null=True)
    organizer_name = serializers.CharField(required=False, allow_blank=True)
    participants_limit = serializers.IntegerField(required=False, allow_null=True)
    # fields for account creation
    account_name = serializers.CharField()
    account_email = serializers.EmailField()

    def create(self, validated_data):
        try:
            with transaction.atomic():
                event = Event.objects.create(
                    name=validated_data.get('name'),
                    location=validated_data.get('location'),
                    start_datetime=validated_data.get('start_datetime'),
                    end_datetime=validated_data.get('end_datetime'),
                    organizer_email=validated_data.get('organizer_email'),
                    description=validated_data.get('description'),
                    link=validated_data.get('link'),
                    image=validated_data.get('image'),
                    organizer_name=validated_data.get('organizer_name'),
                    participants_limit=validated_data.get('participants_limit'),
                )
                organizer = Participant.objects.create(
                    event=event,
                    name=validated_data.get('account_name'),
                    is_admin=True,
                    email=validated_data.get('account_email'),
                )
                return event
        except Exception as e:
            raise serializers.ValidationError(f"Error creating event: {str(e)}")


class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = ['name', 'email', 'password']


class EventWithParticipantsSerializer(serializers.ModelSerializer):
    participants = ParticipantSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = ['uuid', 'name', 'location', 'start_datetime',
                  'end_datetime', 'organizer_email', 'description',
                  'link', 'image', 'organizer_name', 'participants_limit',
                  'participants']

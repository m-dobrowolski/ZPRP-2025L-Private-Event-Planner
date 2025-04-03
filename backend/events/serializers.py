from .models import Event, Invitation, PersonalizedInvitation, Participant, Comment
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.db import transaction


class EventCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['uuid', 'edit_uuid', 'name', 'location', 'start_datetime', 'end_datetime',
                  'organizer_email', 'description', 'link', 'image', 'organizer_name',
                  'participants_limit']
        read_only_fields = ['uuid', 'edit_uuid']


class InvitationSerializer(serializers.ModelSerializer):
    event = serializers.SlugRelatedField(slug_field='uuid', queryset=Event.objects.all(), many=False)
    event_edit_uuid = serializers.UUIDField(write_only=True)

    class Meta:
        model = Invitation
        fields = ['uuid', 'event', 'event_edit_uuid']
        read_only_fields = ['uuid']

    def validate(self, attrs):
        event = attrs['event']
        event_edit_uuid = attrs.get('event_edit_uuid')
        if event.edit_uuid != event_edit_uuid:
            raise serializers.ValidationError("Event edit uuid does not match.")
        return attrs

    def create(self, validated_data):
        return Invitation.objects.create(event=validated_data['event'])



class PersonalizedInvitationSerializer(InvitationSerializer):
    class Meta(InvitationSerializer.Meta):
        model = PersonalizedInvitation
        fields = InvitationSerializer.Meta.fields + ['name']

    def create(self, validated_data):
        return PersonalizedInvitation.objects.create(event=validated_data['event'],
                                                       name=validated_data['name'])











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

class EventEditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['name', 'location', 'start_datetime', 'end_datetime',
                  'organizer_email', 'description', 'link', 'image', 'organizer_name',
                  'participants_limit']

    def valid_participants_limit(self, value):
        if value <= self.instance.participants.count():
            raise serializers.ValidationError("Participants limit must be greater than current participants count.")
        return value

class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = ['name', 'id']

class ParticipantAllSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = '__all__'

class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ['uuid']

class PersonalizedInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalizedInvitation
        fields = ['uuid', 'name']

class CommentSerializer(serializers.ModelSerializer):
    author = ParticipantSerializer(read_only=True)
    class Meta:
        model = Comment
        fields = ['uuid', 'content', 'date', 'author', 'parent']

class EventAdminSerializer(serializers.ModelSerializer):
    participants = ParticipantSerializer(many=True, read_only=True)
    invitations = InvitationSerializer(many=True, read_only=True)
    personalized_invitations = PersonalizedInvitationSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = "__all__"

class EventSerializer(serializers.ModelSerializer):
    participants = ParticipantSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = ['uuid', 'name', 'location', 'start_datetime', 'end_datetime',
                  'organizer_email', 'description', 'link', 'image', 'organizer_name',
                  'participants_limit', 'participants', 'comments']


class InvitationSerializer(serializers.ModelSerializer):
    event = serializers.SlugRelatedField(slug_field='uuid',
                                         queryset=Event.objects.all(), many=False)
    event_edit_uuid = serializers.UUIDField(write_only=True)

    class Meta:
        model = Invitation
        fields = ['uuid', 'event', 'event_edit_uuid']
        read_only_fields = ['uuid']

    def validate(self, attrs):
        event = attrs['event']
        event_edit_uuid = attrs.get('event_edit_uuid')
        if str(event.edit_uuid) != event_edit_uuid:
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


class AcceptInvitationSerializer(serializers.ModelSerializer):
    invitation = serializers.SlugRelatedField(slug_field='uuid', write_only=True,
                                              queryset=Invitation.objects.all(), many=False)
    event = serializers.SlugRelatedField(slug_field='uuid', read_only=True)

    class Meta:
        model = Participant
        fields = ['uuid', 'event', 'name', 'email', 'invitation']
        read_only_fields = ['uuid']

    def create(self, validated_data):
        invitation = validated_data.pop('invitation')
        validated_data['event'] = invitation.event
        return Participant.objects.create(**validated_data)


class AcceptPersonalizedInvitationSerializer(AcceptInvitationSerializer):
    invitation = serializers.SlugRelatedField(slug_field='uuid', write_only=True,
                                              queryset=PersonalizedInvitation.objects.all(), many=False)
    event = serializers.SlugRelatedField(slug_field='uuid', read_only=True)

    class Meta(AcceptInvitationSerializer.Meta):
        read_only_fields = AcceptInvitationSerializer.Meta.read_only_fields + ['name']

    def create(self, validated_data):
        invitation = validated_data.pop('invitation')
        validated_data['event'] = invitation.event
        validated_data['name'] = invitation.name
        with transaction.atomic():
            participant = Participant.objects.create(**validated_data)
            invitation.delete()
        return participant



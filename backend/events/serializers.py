from .models import Event, Invitation, PersonalizedInvitation, Participant, Comment
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.db import transaction


class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = ['name', 'id', 'email']


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
        if str(event.edit_uuid) != str(event_edit_uuid):
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


class CommentSerializer(serializers.ModelSerializer):
    """Used for creating and retrieving comments."""
    event = serializers.SlugRelatedField(slug_field='uuid', queryset=Event.objects.all(), many=False)
    parent = serializers.SlugRelatedField(slug_field='uuid', queryset=Comment.objects.all(), required=False, allow_null=True)
    author = serializers.SlugRelatedField(slug_field='name', read_only=True)
    author_uuid = serializers.UUIDField(write_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['uuid', 'event', 'parent', 'author', 'content', 'date', 'author_uuid', 'replies']
        read_only_fields = ['uuid', 'author', 'date']

    def validate(self, attrs):
        event = attrs.get('event')
        parent = attrs.get('parent')
        author_uuid = attrs.get('author_uuid')

        if not event.participants.filter(uuid=author_uuid).exists():
            raise serializers.ValidationError("Author must be a participant of the event.")
        if (parent is not None) and (parent.event != event):
            raise serializers.ValidationError("Parent comment does not exist in this event.")
        return attrs

    def create(self, validated_data):
        validated_data['author'] = Participant.objects.get(uuid=validated_data.pop('author_uuid'))
        return Comment.objects.create(**validated_data)

    def get_replies(self, obj):
        return CommentSerializer(obj.replies.all(), many=True).data


class EventAdminSerializer(serializers.ModelSerializer):
    """Used for creating, editing events and for retrieving them as admin of the event."""
    participants = ParticipantSerializer(many=True, read_only=True)
    invitations = InvitationSerializer(many=True, read_only=True)
    personalized_invitations = PersonalizedInvitationSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    read_only_fields = ['id', 'uuid', 'edit_uuid']

    class Meta:
        model = Event
        fields = "__all__"

    def validate_participants_limit(self, value):
        if value is not None and value < 1:
            raise serializers.ValidationError("Participants limit must be greater than 0.")
        if self.instance and value < self.instance.participants.count():
            raise serializers.ValidationError("Participants limit must be greater than participants count.")
        return value

    def validate(self, attrs):
        if attrs.get('start_datetime') and attrs.get('end_datetime'):
            if attrs['start_datetime'] >= attrs['end_datetime']:
                raise serializers.ValidationError("End datetime must be after start datetime.")
        return attrs


class EventSerializer(serializers.ModelSerializer):
    """Used for retrieving events as a participant."""
    participants = ParticipantSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = ['uuid', 'name', 'location', 'start_datetime', 'end_datetime',
                  'organizer_email', 'description', 'link', 'image', 'organizer_name',
                  'participants_limit', 'participants', 'comments']


class AcceptInvitationSerializer(serializers.ModelSerializer):
    invitation = serializers.SlugRelatedField(slug_field='uuid', write_only=True,
                                              queryset=Invitation.objects.all(), many=False)
    event = serializers.SlugRelatedField(slug_field='uuid', read_only=True)

    class Meta:
        model = Participant
        fields = ['uuid', 'event', 'name', 'email', 'invitation']
        read_only_fields = ['uuid']

    def validate(self, attrs):
        email = attrs.get('email')
        event = attrs.get('invitation').event
        if event.participants.filter(email=email).exists():
            raise serializers.ValidationError("Participant with this email already exists in this event.")
        return attrs

    def create(self, validated_data):
        invitation = validated_data.pop('invitation')
        validated_data['event'] = invitation.event
        return Participant.objects.create(**validated_data)


class InvitationDetailsSerializer(serializers.ModelSerializer):
    event_name = serializers.CharField(source='event.name', read_only=True)
    event_uuid = serializers.UUIDField(source='event.uuid', read_only=True)

    class Meta:
        model = Invitation
        fields = ['event_name', 'event_uuid']


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

class PersonalizedInvitationDetailsSerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    event_uuid = serializers.UUIDField(source='event.uuid', read_only=True)

    class Meta:
        model = PersonalizedInvitation
        fields = ['uuid', 'name', 'event_name', 'event_uuid']
        read_only_fields = ['uuid', 'name', 'event_name', 'event_uuid']

# Generated by Django 5.0 on 2025-04-03 18:59

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0003_remove_invitation_name_remove_participant_is_admin_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='comment',
            name='uuid',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.DeleteModel(
            name='PersonalizedInvitation',
        ),
    ]

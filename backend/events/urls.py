from django.urls import path
from events import views
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

app_name = 'events'

urlpatterns = [
    path('event/create/', views.EventCreate.as_view(), name='event-create'),
    path('event/<uuid:uuid>/<uuid:edit_uuid>/', views.EventAdminDetail.as_view(), name='event-admin-detail'),
    path('event/<uuid:uuid>/', views.EventDetail.as_view(), name='event-detail'),
    path('event/ics/<uuid:uuid>/', views.EventICSDownloadView.as_view(), name='event-ics'),
    path('invitation/create/', views.InvitationCreate.as_view(), name='invitation-create'),
    path('invitation/accept/', views.InvitationAccept.as_view(), name='invitation-accept'),
    path('invitation/details/<uuid:uuid>/', views.InvitationDetails.as_view(), name='invitation-details'),
    path('invitation/delete/<uuid:uuid>/<uuid:edit_uuid>/', views.InvitationDelete.as_view(), name='invitation-delete'),
    path('personalized-invitation/create/', views.PersonalizedInvitationCreate.as_view(), name='personalized-invitation-create'),
    path('personalized-invitation/accept/', views.PersonalizedInvitationAccept.as_view(), name='personalized-invitation-accept'),
    path('personalized-invitation/details/<uuid:uuid>/', views.PersonalizedInvitationDetails.as_view(), name='personalized-invitation-details'),
    path('personalized-invitation/delete/<uuid:uuid>/<uuid:edit_uuid>/', views.PersonalizedInvitationDelete.as_view(), name='personalized-invitation-delete'),
    path('participant/<uuid:uuid>/', views.LeaveEvent.as_view(), name='leave-event'),
    path('participant/<int:id>/<uuid:edit_uuid>/', views.DeleteParticipantAsAdmin.as_view(), name='delete-participant-admin'),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='events:schema'), name='swagger-ui'),
    path('test_email/', views.test_email_view, name='test_email'),
    path('comments/create/', views.CommentsCreate.as_view(), name='comments-create'),
    path('comments/<uuid:event_uuid>/', views.CommentsList.as_view(), name='comments-list'),
    path('comments/delete/<uuid:comment_uuid>/<uuid:participant_or_event_edit_uuid>', views.CommentsDelete.as_view(), name='comments-delete'),
]
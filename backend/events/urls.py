from django.urls import path, include
from events import views
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework import routers

app_name = 'events'
router = routers.DefaultRouter()
# router.register(r'event-admin', views.EventAdminViewSet, basename='event-admin')
router.register(r'event', views.EventViewSet, basename='event')
router.register(r'invitation', views.InvitationViewSet, basename='invitation')
router.register(r'personalized-invitation', views.PersonalizedInvitationViewSet, basename='personalized-invitation')
router.register(r'comment', views.CommentViewSet, basename='comment')

manual_admin_urls = [
    path('event-admin/<uuid:uuid>/<uuid:edit_uuid>/',
         views.EventAdminViewSet.as_view({
             'put': 'update',
             'patch': 'partial_update',
             'delete': 'destroy',
             'get': 'retrieve'
         }),
         name='event-admin-detail'),

    path('event-admin/',
         views.EventAdminViewSet.as_view({
             'post': 'create'
         }),
         name='event-admin-list'),

    path('event-admin/remove-participant/<int:id>/<uuid:edit_uuid>/',
         views.EventAdminViewSet.as_view({
             'delete': 'remove_participant'
         }),
         name='event-admin-remove-participant'),
]

urlpatterns = [
    path('', include(router.urls)),
    # path('event/create/', views.EventCreate.as_view(), name='event-create'),
    # path('event/<uuid:uuid>/<uuid:edit_uuid>/', views.EventAdminDetail.as_view(), name='event-admin-detail'),
    # path('event/<uuid:uuid>/', views.EventDetail.as_view(), name='event-detail'),
    # path('event/ics/<uuid:uuid>/', views.EventICSDownloadView.as_view(), name='event-ics'),
    # path('invitation/create/', views.InvitationCreate.as_view(), name='invitation-create'),
    # path('invitation/accept/', views.InvitationAccept.as_view(), name='invitation-accept'),
    # path('invitation/details/<uuid:uuid>/', views.InvitationDetails.as_view(), name='invitation-details'),
    # path('invitation/delete/<uuid:uuid>/<uuid:edit_uuid>/', views.InvitationDelete.as_view(), name='invitation-delete'),
    # path('personalized-invitation/create/', views.PersonalizedInvitationCreate.as_view(), name='personalized-invitation-create'),
    # path('personalized-invitation/accept/', views.PersonalizedInvitationAccept.as_view(), name='personalized-invitation-accept'),
    # path('personalized-invitation/details/<uuid:uuid>/', views.PersonalizedInvitationDetails.as_view(), name='personalized-invitation-details'),
    # path('personalized-invitation/delete/<uuid:uuid>/<uuid:edit_uuid>/', views.PersonalizedInvitationDelete.as_view(), name='personalized-invitation-delete'),
    # path('participant/<uuid:uuid>/', views.LeaveEvent.as_view(), name='leave-event'),
    # path('participant/<int:id>/<uuid:edit_uuid>/', views.DeleteParticipantAsAdmin.as_view(), name='delete-participant-admin'),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='events:schema'), name='swagger-ui'),
    path('test_email/', views.test_email_view, name='test_email'),
    # path('comments/create/', views.CommentsCreate.as_view(), name='comments-create'),
    # path('comments/<uuid:event_uuid>/', views.CommentsList.as_view(), name='comments-list'),
    # path('comments/delete/<uuid:comment_uuid>/<uuid:participant_or_event_edit_uuid>', views.CommentsDelete.as_view(), name='comments-delete'),
]

urlpatterns += manual_admin_urls
from django.urls import include, path
from drf_spectacular.views import (
                 SpectacularAPIView,
                 SpectacularSwaggerView,
)
from rest_framework import routers

from events import views

app_name = 'events'
router = routers.DefaultRouter()
router.register(r'event', views.EventViewSet, basename='event')
router.register(r'invitation', views.InvitationViewSet, basename='invitation')
router.register(r'personalized-invitation', views.PersonalizedInvitationViewSet,
                 basename='personalized-invitation')
router.register(r'comment', views.CommentViewSet, basename='comment')

manual_admin_urls = [
    path('event-admin/<uuid:uuid>/<uuid:edit_uuid>/',
         views.EventAdminViewSet.as_view({
             'put': 'update',
             'patch': 'partial_update',
             'delete': 'destroy',
             'get': 'retrieve',
         }),
         name='event-admin-detail'),

    path('event-admin/',
         views.EventAdminViewSet.as_view({
             'post': 'create',
         }),
         name='event-admin-list'),

    path('event-admin/remove-participant/<int:id>/<uuid:edit_uuid>/',
         views.EventAdminViewSet.as_view({
             'delete': 'remove_participant',
         }),
         name='event-admin-remove-participant'),
]

urlpatterns = [
    path('', include(router.urls)),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='events:schema'),
          name='swagger-ui'),
    path('test_email/', views.test_email_view, name='test_email'),
]

urlpatterns += manual_admin_urls

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    getEventAdminDetails,
    updateEvent,
    deleteEvent,
    deleteParticipantAsAdmin,
    deleteUniversalInvitation,
    deletePersonalizedInvitation,
    createPersonalizedInvitation,
    createUniversalInvitation,
    getComments,
    deleteComment
} from '@/api/api';
import styles from '@/app/[locale]/event/[uuid]/[edit_uuid]/editEvent.module.css';
import modalStyles from '@/app/[locale]/event/[uuid]/[edit_uuid]/addParticipantModal.module.css';
import { useTranslation } from 'react-i18next';

export default function EditEventClient({ uuid, edit_uuid }) {
    const router = useRouter();
    const { t } = useTranslation('translation');
    const params = useParams();
    const currentLocale = params.locale;

    const [formData, setFormData] = useState({
        name: '',
        location: '',
        start_datetime: '',
        end_datetime: '',
        organizer_email: '',
        description: '',
        link: '',
        image: null,
        current_image_url: '',
        organizer_name: '',
        participants_limit: '',
    });

    const [imagePreview, setImagePreview] = useState(null);

    // Participant states
    const [participants, setParticipants] = useState([]);
    const [universalInvitations, setUniversalInvitations] = useState([]);
    const [personalizedInvitations, setPersonalizedInvitations] = useState([]);

    // Add participant modal
    const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
    const [addPersonalizedFormData, setAddPersonalizedFormData] = useState({ name: '' });
    const [createdPersonalizedLink, setCreatedPersonalizedLink] = useState(null);

    // Loading states
    const [loadingFetch, setLoadingFetch] = useState(true);
    const [loadingSave, setLoadingSave] = useState(false);
    const [loadingDeleteEvent, setLoadingDeleteEvent] = useState(false);
    const [deletingParticipantId, setDeletingParticipantId] = useState(null);
    const [deletingUniversalInvitationUuid, setDeletingUniversalInvitationUuid] = useState(null);
    const [deletingPersonalizedInvitationUuid, setDeletingPersonalizedInvitationUuid] = useState(null);
    const [loadingAddPersonalized, setLoadingAddPersonalized] = useState(false);
    const [loadingAddUniversal, setLoadingAddUniversal] = useState(false);

    // Error states
    const [errorFetch, setErrorFetch] = useState(null);
    const [errorSave, setErrorSave] = useState(null);
    const [errorDeleteEvent, setErrorDeleteEvent] = useState(null);
    const [errorDeleteParticipant, setErrorDeleteParticipant] = useState(null);
    const [errorDeleteUniversalInvitation, setErrorDeleteUniversalInvitation] = useState(null);
    const [errorDeletePersonalizedInvitation, setErrorDeletePersonalizedInvitation] = useState(null);
    const [errorAddPersonalized, setErrorAddPersonalized] = useState(null);
    const [errorAddUniversal, setErrorAddUniversal] = useState(null);
    const [errorDeleteComment, setErrorDeleteComment] = useState(null);

    const [comments, setComments] = useState([]);
    const [deletingCommentId, setDeletingCommentId] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);

    const fetchEventData = async () => {
        setLoadingFetch(true);
        setErrorFetch(null);
        setErrorDeleteParticipant(null);
        setErrorDeleteUniversalInvitation(null);
        setErrorDeletePersonalizedInvitation(null);
        setErrorAddPersonalized(null);
        setErrorAddUniversal(null);
        setErrorDeleteComment(null);

        try {
            const [data, commentsData] = await Promise.all([
                getEventAdminDetails(uuid, edit_uuid),
                getComments(uuid)
            ]);

            setFormData({
                name: data.name || '',
                location: data.location || '',
                start_datetime: data.start_datetime ? new Date(data.start_datetime).toISOString().slice(0, 16) : '',
                end_datetime: data.end_datetime ? new Date(data.end_datetime).toISOString().slice(0, 16) : '',
                organizer_email: data.organizer_email || '',
                description: data.description || '',
                link: data.link || '',
                image: null,
                current_image_url: data.image || '',
                organizer_name: data.organizer_name || '',
                participants_limit: data.participants_limit || '',
            });
            setImagePreview(data.image || null);

            setParticipants(data.participants || []);
            setUniversalInvitations(data.invitations || []);
            setPersonalizedInvitations(data.personalized_invitations || []);
            setComments(commentsData || []);

        } catch (err) {
            setErrorFetch(err.message || t('fetch_edit_event_failed_error'));
            console.error('Error fetching event for edit:', err);
        } finally {
            setLoadingFetch(false);
        }
    };

    useEffect(() => {
        if (!uuid || !edit_uuid) {
            setLoadingFetch(false);
            setErrorFetch(t('edit_keys_missing_error'));
            return;
        }
        fetchEventData();

    }, [uuid, edit_uuid, t]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            const file = files ? files[0] : null;
            setFormData(prev => ({
                ...prev,
                [name]: file
            }));
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setImagePreview(formData.current_image_url);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async () => {
        setLoadingSave(true);
        setErrorSave(null);

        try {
            const formDataToSend = new FormData();
            for (const key in formData) {
                if (key === 'current_image_url') {
                    continue;
                }

                const value = formData[key];

                if (key === 'image') {
                    if (value instanceof File) {
                        formDataToSend.append(key, value);
                    }
                } else if (value !== null && value !== undefined) {
                    formDataToSend.append(key, value);
                }
            }

            await updateEvent(uuid, edit_uuid, formDataToSend);
            router.push(`/event/${uuid}`);

        } catch (error) {
            console.error('Error updating event:', error);
            setErrorSave(error.message || t('update_event_failed_error'));
        } finally {
            setLoadingSave(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!confirm(t('confirm_delete_event'))) {
            return;
        }

        setLoadingDeleteEvent(true);
        setErrorDeleteEvent(null);

        try {
            await deleteEvent(uuid, edit_uuid);
            router.push('/');

        } catch (error) {
            console.error('Error deleting event:', error);
            setErrorDeleteEvent(error.message || t('delete_event_failed_error'));
        } finally {
            setLoadingDeleteEvent(false);
        }
    };

    const handleDeleteParticipant = async (participantId, participantName) => {
         if (!confirm(t('confirm_delete_participant', { name: participantName || t('unnamed_participant') }))) {
             return;
         }

         setDeletingParticipantId(participantId);
         setErrorDeleteParticipant(null);

         try {
             await deleteParticipantAsAdmin(participantId, edit_uuid);
             setParticipants(participants.filter(p => p.id !== participantId));
             alert(t('participant_deleted_success', { name: participantName || t('unnamed_participant') }));

         } catch (error) {
             console.error(`Error deleting participant ${participantId}:`, error);
             const errorMessage = error.response?.data?.detail || error.message || t('delete_participant_failed_error', { name: participantName || t('unnamed_participant') });
             setErrorDeleteParticipant(errorMessage);
         } finally {
             setDeletingParticipantId(null);
         }
    };

    const handleDeleteUniversalInvitation = async (invitationUuid) => {
        if (!confirm(t('confirm_delete_universal_invitation'))) {
            return;
        }
        setDeletingUniversalInvitationUuid(invitationUuid);
        setErrorDeleteUniversalInvitation(null);
        try {
            await deleteUniversalInvitation(invitationUuid, edit_uuid);
            setUniversalInvitations(universalInvitations.filter(inv => inv.uuid !== invitationUuid));
            alert(t('universal_invitation_deleted_success'));
        } catch (error) {
             console.error(`Error deleting universal invitation ${invitationUuid}:`, error);
             const errorMessage = error.response?.data?.detail || error.message || t('delete_universal_invitation_failed_error');
             setErrorDeleteUniversalInvitation(errorMessage);
        } finally {
             setDeletingUniversalInvitationUuid(null);
        }
    };

    const handleDeletePersonalizedInvitation = async (invitationUuid, participantName) => {
        if (!confirm(t('confirm_delete_personalized_invitation', { name: participantName || t('unnamed_invitation') }))) {
            return;
        }
        setDeletingPersonalizedInvitationUuid(invitationUuid);
        setErrorDeletePersonalizedInvitation(null);
        try {
            await deletePersonalizedInvitation(invitationUuid, edit_uuid);
            setPersonalizedInvitations(personalizedInvitations.filter(inv => inv.uuid !== invitationUuid));
            alert(t('personalized_invitation_deleted_success', { name: participantName || t('unnamed_invitation') }));
        } catch (error) {
            console.error(`Error deleting personalized invitation ${invitationUuid}:`, error);
            const errorMessage = error.response?.data?.detail || error.message || t('delete_personalized_invitation_failed_error', { name: participantName || t('unnamed_invitation') });
            setErrorDeletePersonalizedInvitation(errorMessage);
        } finally {
            setDeletingPersonalizedInvitationUuid(null);
        }
    };

    const openAddParticipantModal = () => {
        setShowAddParticipantModal(true);
        setAddPersonalizedFormData({ name: '' });
        setCreatedPersonalizedLink(null);
        setErrorAddPersonalized(null);
        setErrorAddUniversal(null);
    };

    const closeAddParticipantModal = () => {
        setShowAddParticipantModal(false);
    };

    const handleAddPersonalizedChange = (e) => {
        const { name, value } = e.target;
        setAddPersonalizedFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddPersonalizedSubmit = async (e) => {
        e.preventDefault();
        setLoadingAddPersonalized(true);
        setErrorAddPersonalized(null);

        if (!addPersonalizedFormData.name.trim()) {
            setErrorAddPersonalized(t('personalized_name_required_error'));
            setLoadingAddPersonalized(false);
            return;
        }

        try {
            const response = await createPersonalizedInvitation(
                uuid,
                edit_uuid,
                addPersonalizedFormData.name.trim(),
            );
            console.log('Personalized invitation created:', response);

            if (response && response.uuid) {
                 const invitationLink = `${window.location.origin}/${currentLocale}/personalized-invitation/accept/${response.uuid}`;
                 setCreatedPersonalizedLink(invitationLink);
                 setPersonalizedInvitations(prev => [...prev, response]);
                 setAddPersonalizedFormData({ name: '' });

            } else {
                console.error('API response missing invitation UUID:', response);
                setErrorAddPersonalized(t('create_personalized_invalid_response_error'));
            }

            await fetchEventData();

        } catch (error) {
            console.error('Error creating personalized invitation:', error);
            const errorMessage = error.response?.data?.detail || error.message || t('create_personalized_failed_error');
            setErrorAddPersonalized(errorMessage);
        } finally {
            setLoadingAddPersonalized(false);
        }
    };

    const handleCreateUniversalInvitation = async () => {
        if (universalInvitations.length > 0) {
            setErrorAddUniversal(t('universal_invitation_exists_error'));
            return;
        }

        setLoadingAddUniversal(true);
        setErrorAddUniversal(null);
        try {
            const response = await createUniversalInvitation(uuid, edit_uuid);
            console.log('Universal invitation created:', response);
            alert(t('universal_invitation_created_alert'));

            await fetchEventData();

        } catch (error) {
            console.error('Error creating universal invitation:', error);
            const errorMessage = error.response?.data?.detail || error.message || t('create_universal_failed_error');
            setErrorAddUniversal(errorMessage);
        } finally {
            setLoadingAddUniversal(false);
        }
    };

    const copyToClipboard = (text, messageKey, children) => {
        navigator.clipboard.writeText(text).then(() => {
            alert(t(messageKey, children));
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert(t('copy_failed_alert'));
        });
    };

    const currentUniversalLink = universalInvitations.length > 0 ?
        `${window.location.origin}/${currentLocale}/invitation/accept/${universalInvitations[0].uuid}` : null;


    const isMainActionLoading = loadingSave || loadingDeleteEvent || deletingParticipantId !== null || deletingUniversalInvitationUuid !== null || deletingPersonalizedInvitationUuid !== null;

    const isAddModalLoading = loadingAddPersonalized || loadingAddUniversal;

    const handleDeleteComment = async (commentUuid, authorName) => {
        if (!confirm(t('confirm_delete_comment', { author: authorName || t('unknown_author') }))) {
            return;
        }

        setDeletingCommentId(commentUuid);
        setErrorDeleteComment(null);

        try {
            await deleteComment(commentUuid, edit_uuid);
            // Update comments list immediately
            setComments(prevComments => prevComments.filter(c => c.uuid !== commentUuid));
        } catch (error) {
            console.error(`Error deleting comment ${commentUuid}:`, error);
            const errorMessage = error.response?.data?.detail || error.message || t('delete_comment_failed_error', { author: authorName || t('unknown_author') });
            setErrorDeleteComment(errorMessage);
        } finally {
            setDeletingCommentId(null);
        }
    };

    const formatDateTime = (datetimeString) => {
        if (!datetimeString) return t('not_available_abbr');
        try {
            const date = new Date(datetimeString);
            if (isNaN(date.getTime())) {
                return datetimeString;
            }
        return date.toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        } catch (e) {
            console.error("Error formatting date:", e);
            return datetimeString;
        }
    };

    if (loadingFetch) {
        return <div className={styles.container}>{t('loading_edit_event')}</div>;
    }

    if (errorFetch) {
        return <div className={`${styles.container} ${styles.error}`}>{t('error_loading_event_prefix')}: {errorFetch}</div>;
    }


    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{t('edit_event_title', { eventName: formData.name || t('event_fallback_name') })}</h1>
            {errorSave && <div className={styles.error}>{errorSave}</div>}
            {errorDeleteEvent && <div className={styles.error}>{errorDeleteEvent}</div>}
            {errorDeleteParticipant && <div className={styles.error}>{errorDeleteParticipant}</div>}
            {errorDeleteUniversalInvitation && <div className={styles.error}>{errorDeleteUniversalInvitation}</div>}
            {errorDeletePersonalizedInvitation && <div className={styles.error}>{errorDeletePersonalizedInvitation}</div>}
            {errorDeleteComment && <div className={styles.error}>{errorDeleteComment}</div>}


            <form id="editEventForm" onSubmit={ handleSubmit } className={styles.form}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>{t('event_name_label')}*</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={styles.input}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>{t('location_label')}*</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className={styles.input}
                        required
                    />
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>{t('start_datetime_label')}*</label>
                        <input
                            type="datetime-local"
                            name="start_datetime"
                            value={formData.start_datetime}
                            onChange={handleChange}
                            className={styles.input}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>{t('end_datetime_label')}*</label>
                        <input
                            type="datetime-local"
                            name="end_datetime"
                            value={formData.end_datetime}
                            onChange={handleChange}
                            className={styles.input}
                            required
                        />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>{t('organizer_email_label')}*</label>
                    <input
                        type="email"
                        name="organizer_email"
                        value={formData.organizer_email}
                        onChange={handleChange}
                        className={styles.input}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>{t('organizer_name_label')}</label>
                    <input
                        type="text"
                        name="organizer_name"
                        value={formData.organizer_name}
                        onChange={handleChange}
                        className={styles.input}
                    />
                </div>


                <div className={styles.formGroup}>
                    <label className={styles.label}>{t('description_label')}</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className={styles.textarea}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>{t('external_link_label')}</label>
                    <input
                        type="url"
                        name="link"
                        value={formData.link}
                        onChange={handleChange}
                        className={styles.input}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>{t('event_image_label')}</label>
                    {(imagePreview || formData.current_image_url) && (
                        <div className={styles.imagePreviewContainer}>
                            <img src={imagePreview || formData.current_image_url} alt={t('image_preview_alt')} className={styles.imagePreview} />
                        </div>
                    )}
                    <input
                        type="file"
                        name="image"
                        onChange={handleChange}
                        className={styles.fileInput}
                        accept="image/*"
                    />
                        <small className={styles.helpText}>{t('image_upload_help')}</small>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>{t('participants_limit_label')}</label>
                    <input
                        type="number"
                        name="participants_limit"
                        value={formData.participants_limit}
                        onChange={handleChange}
                        className={styles.input}
                        min="1"
                    />
                </div>
            </form>

            {/* --- Participants Section --- */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>{t('participants_heading', { count: participants.length })}</h2>
                    <button
                        className={styles.toggleButton}
                        onClick={() => setShowParticipants(!showParticipants)}
                        aria-label={showParticipants ? "Hide participants" : "Show participants"}
                    >
                        {showParticipants ? '▲' : '▼'}
                    </button>
                </div>
                {showParticipants && (
                    <>
                        {participants.length > 0 ? (
                            <ul className={styles.participantList}>
                                {participants.map(participant => (
                                    <li key={participant.id} className={styles.participantItem}>
                                        <span>
                                            {participant.name} {participant.email ? `(${participant.email})` : ''}
                                        </span>
                                        <button
                                            className={styles.deleteParticipantButton}
                                            onClick={() => handleDeleteParticipant(participant.id, participant.name || 'Unnamed Participant')}
                                            disabled={deletingParticipantId === participant.id || isMainActionLoading || isAddModalLoading}
                                        >
                                            {deletingParticipantId === participant.id ? t('deleting_button') : t('delete_button')}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No participants have joined yet.</p>
                        )}
                    </>
                )}
            </div>

            {/* --- Comments Section --- */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>{t('comments_heading', { count: comments.length })}</h2>
                    <button
                        className={styles.toggleButton}
                        onClick={() => setShowComments(!showComments)}
                        aria-label={showComments ? t('hide_comments_label') : t('show_comments_label')}
                    >
                        {showComments ? '▲' : '▼'}
                    </button>
                </div>
                {showComments && (
                    <>
                        {comments.length > 0 ? (
                            <ul className={styles.commentList}>
                                {comments.map(comment => (
                                    <li key={comment.uuid} className={styles.commentItem}>
                                        <div className={styles.commentHeader}>
                                            <strong>{comment.author || t('unknown_author')}</strong>
                                            <span className={styles.commentDate}>
                                                {formatDateTime(comment.date)}
                                            </span>
                                        </div>
                                        <p className={styles.commentContent}>{comment.content}</p>
                                        <button
                                            className={styles.deleteCommentButton}
                                            onClick={() => handleDeleteComment(comment.uuid, comment.author || 'Unknown Author')}
                                            disabled={deletingCommentId === comment.uuid || isMainActionLoading || isAddModalLoading}
                                        >
                                            {deletingCommentId === comment.uuid ? t('deleting_button') : t('delete_button')}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>{t('no_comments_yet')}</p>
                        )}
                    </>
                )}
            </div>


            {/* --- Invitations Section --- */}
            <div className={styles.section}>

                {/* Universal Invitations */}
                <h3>{t('universal_invitation_link_heading')}</h3>
                {universalInvitations.length > 0 ? (
                    <ul className={styles.invitationList}>
                        {universalInvitations.map(invitation => (
                            <li key={invitation.uuid} className={styles.invitationItem}>
                                <span>
                                    {t('link_label')}: <Link href={`/${currentLocale}/invitation/accept/${invitation.uuid}`} >
                                        {`${window.location.origin}/invitation/accept/${invitation.uuid}`}
                                    </Link>
                                </span>
                                <button
                                    className={styles.copyLinkButton}
                                    onClick={() => copyToClipboard(`${window.location.origin}/${currentLocale}/invitation/accept/${invitation.uuid}`, 'universal_link_copied_alert')}
                                >
                                    {t('copy_link_button')}
                                </button>
                                <button
                                    className={styles.deleteInvitationButton}
                                    onClick={() => handleDeleteUniversalInvitation(invitation.uuid)}
                                    disabled={deletingUniversalInvitationUuid === invitation.uuid || isMainActionLoading || isAddModalLoading}
                                >
                                    {deletingUniversalInvitationUuid === invitation.uuid ? t('deleting_button') : t('delete_link_button')}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>{t('no_universal_invitation_link_yet')}</p>
                )}

                {/* Personalized Invitations */}
                <h3>{t('personalized_invitations_heading', { count: personalizedInvitations.length })}</h3>
                {personalizedInvitations.length > 0 ? (
                    <ul className={styles.invitationList}>
                        {personalizedInvitations.map(invitation => (
                            <li key={invitation.uuid} className={styles.invitationItem}>
                                <span>
                                    <strong>{invitation.name}</strong>
                                </span>
                                <button
                                    className={styles.copyLinkButton}
                                    onClick={() => copyToClipboard(`${window.location.origin}/${currentLocale}/personalized-invitation/accept/${invitation.uuid}`, 'personalized_link_copied_alert', { name: invitation.name })}
                                    disabled={deletingPersonalizedInvitationUuid === invitation.uuid || isMainActionLoading || isAddModalLoading}
                                >
                                    {t('copy_link_button')}
                                </button>
                                <button
                                    className={styles.deleteInvitationButton}
                                    onClick={() => handleDeletePersonalizedInvitation(invitation.uuid, invitation.name)}
                                    disabled={deletingPersonalizedInvitationUuid === invitation.uuid || isMainActionLoading || isAddModalLoading}
                                >
                                    {deletingPersonalizedInvitationUuid === invitation.uuid ? t('deleting_button') : t('delete_button')}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>{t('no_personalized_invitations_yet')}</p>
                )}
                <button
                    onClick={openAddParticipantModal}
                    className={styles.submitButton}
                    disabled={isMainActionLoading || isAddModalLoading}
                >
                    {t('add_new_participant_button')}
                </button>

                <button
                    type="submit"
                    form={"editEventForm"}
                    className={styles.submitButton}
                    disabled={loadingSave || loadingDeleteEvent || isMainActionLoading || isAddModalLoading}
                >
                    {loadingSave ? t('saving_button') : t('save_changes_button')}
                </button>

                <button
                    className={styles.deleteButton}
                    onClick={handleDeleteEvent}
                    disabled={loadingSave || loadingDeleteEvent || isMainActionLoading || isAddModalLoading}
                >
                    {loadingDeleteEvent ? t('deleting_button') : t('delete_event_button')}
                </button>
            </div>

            {/* --- Add Participant Modal --- */}
            {showAddParticipantModal && (
                <div className={modalStyles.modalOverlay} onClick={closeAddParticipantModal}>
                    <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}> {/* Prevent clicks inside closing the modal */}
                        <button className={modalStyles.closeButton} onClick={closeAddParticipantModal}>×</button>
                        <h2>{t('add_participant_modal_title')}</h2>

                        {isAddModalLoading && <div className={modalStyles.loading}>{t('processing_message')}</div>}
                        {errorAddPersonalized && <div className={modalStyles.error}>{errorAddPersonalized}</div>}
                        {errorAddUniversal && <div className={modalStyles.error}>{errorAddUniversal}</div>}

                        <div className={modalStyles.section}>
                            <h3>{t('send_personalized_invitation_heading')}</h3>
                            {createdPersonalizedLink ? (
                                <div className={modalStyles.universalLinkBox}>
                                    <strong>{t('personalized_invitation_link_label')}:</strong>
                                    <p>
                                        <Link href={createdPersonalizedLink} target="_blank" rel="noopener noreferrer">
                                            {createdPersonalizedLink}
                                        </Link>
                                    </p>
                                    <small>{t('personalized_link_help_text')}</small>
                                    <button
                                        className={modalStyles.copyLinkButton}
                                        onClick={() => copyToClipboard(createdPersonalizedLink, 'personalized_link_copied_nameless_alert')}
                                    >
                                        {t('copy_link_button')}
                                    </button>
                                    <button
                                        className={modalStyles.createLinkButton}
                                        onClick={() => {
                                            setCreatedPersonalizedLink(null);
                                            setAddPersonalizedFormData({ name: '' });
                                            setErrorAddPersonalized(null);
                                        }}
                                        disabled={isAddModalLoading}
                                    >
                                        {t('send_another_invitation_button')}
                                    </button>
                               </div>
                            ) : (
                                <>
                                    <p>{t('create_personalized_help_text')}</p>
                                    <form onSubmit={handleAddPersonalizedSubmit} className={modalStyles.form}>
                                        <div className={modalStyles.formGroup}>
                                            <label className={modalStyles.label}>{t('name_label')}</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={addPersonalizedFormData.name}
                                                onChange={handleAddPersonalizedChange}
                                                className={modalStyles.input}
                                                required
                                                disabled={isAddModalLoading}
                                            />
                                        </div>
                                        <button type="submit" className={modalStyles.submitButton} disabled={isAddModalLoading || !addPersonalizedFormData.name.trim()}>
                                            {loadingAddPersonalized ? t('creating_button') : t('create_personalized_link_button')}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>

                        <div className={modalStyles.section}>
                            <h3>{t('universal_invitation_link_heading')}</h3>
                            <p>{t('universal_invitation_help_text')}</p>

                            {currentUniversalLink ? (
                                <div className={modalStyles.universalLinkBox}>
                                    <strong>{t('invitation_link_label')}:</strong>
                                    <p>
                                        <Link href={currentUniversalLink} target="_blank" rel="noopener noreferrer">
                                            {currentUniversalLink}
                                        </Link>
                                    </p>
                                    <small>{t('universal_link_share_help_text')}</small>
                                    <button
                                        className={modalStyles.copyLinkButton}
                                        onClick={() => copyToClipboard(currentUniversalLink, 'universal_link_copied_alert')}
                                    >
                                        {t('copy_link_button')}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleCreateUniversalInvitation}
                                    className={modalStyles.createLinkButton}
                                    disabled={isAddModalLoading}
                                >
                                    {loadingAddUniversal ? t('generating_link_button') : t('generate_universal_link_button')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
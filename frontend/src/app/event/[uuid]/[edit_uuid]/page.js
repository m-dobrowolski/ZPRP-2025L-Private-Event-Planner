'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getEventAdminDetails,
    updateEvent,
    deleteEvent,
    deleteParticipantAsAdmin,
    deleteGenericInvitation,
    deletePersonalizedInvitation,
    createPersonalizedInvitation,
    createGenericInvitation,
    getComments,
    deleteComment
} from '@/api/api';
import styles from './editEvent.module.css';
import modalStyles from './addParticipantModal.module.css'

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const uuid = params.uuid;
    const edit_uuid = params.edit_uuid;

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
    const [genericInvitations, setGenericInvitations] = useState([]);
    const [personalizedInvitations, setPersonalizedInvitations] = useState([]);

    // Add participant modal
    const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
    const [addPersonalizedFormData, setAddPersonalizedFormData] = useState({ name: '' });
    const [createdPersonalizedLink, setCreatedPersonalizedLink] = useState(null);
    const [loadingAddPersonalized, setLoadingAddPersonalized] = useState(false);
    const [loadingAddGeneric, setLoadingAddGeneric] = useState(false);
    const [errorAddPersonalized, setErrorAddPersonalized] = useState(null);
    const [errorAddGeneric, setErrorAddGeneric] = useState(null);

    // Loading states
    const [loadingFetch, setLoadingFetch] = useState(true);
    const [loadingSave, setLoadingSave] = useState(false);
    const [loadingDeleteEvent, setLoadingDeleteEvent] = useState(false);
    const [deletingParticipantId, setDeletingParticipantId] = useState(null);
    const [deletingGenericInvitationUuid, setDeletingGenericInvitationUuid] = useState(null);
    const [deletingPersonalizedInvitationUuid, setDeletingPersonalizedInvitationUuid] = useState(null);

    // Error states
    const [errorFetch, setErrorFetch] = useState(null);
    const [errorSave, setErrorSave] = useState(null);
    const [errorDeleteEvent, setErrorDeleteEvent] = useState(null);
    const [errorDeleteParticipant, setErrorDeleteParticipant] = useState(null);
    const [errorDeleteGenericInvitation, setErrorDeleteGenericInvitation] = useState(null);
    const [errorDeletePersonalizedInvitation, setErrorDeletePersonalizedInvitation] = useState(null);
    const [errorDeleteComment, setErrorDeleteComment] = useState(null);

    const [comments, setComments] = useState([]);
    const [deletingCommentId, setDeletingCommentId] = useState(null);
    const [showComments, setShowComments] = useState(false);

    const fetchEventData = async () => {
        setLoadingFetch(true);
        setErrorFetch(null);
        setErrorDeleteParticipant(null);
        setErrorDeleteGenericInvitation(null);
        setErrorDeletePersonalizedInvitation(null);
        setErrorAddPersonalized(null);
        setErrorAddGeneric(null);
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
            setGenericInvitations(data.invitations || []);
            setPersonalizedInvitations(data.personalized_invitations || []);
            setComments(commentsData || []);

        } catch (err) {
            setErrorFetch(err.message || 'Failed to fetch event for editing. Check UUIDs.');
            console.error('Error fetching event for edit:', err);
        } finally {
            setLoadingFetch(false);
        }
    };

    useEffect(() => {
        if (!uuid || !edit_uuid) {
            setLoadingFetch(false);
            setErrorFetch("Event identifier or edit key is missing.");
            return;
        }
        fetchEventData();

    }, [uuid, edit_uuid]);

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
            setErrorSave(error.message || 'Failed to update event.');
        } finally {
            setLoadingSave(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            return;
        }

        setLoadingDeleteEvent(true);
        setErrorDeleteEvent(null);

        try {
            await deleteEvent(uuid, edit_uuid);
            router.push('/');

        } catch (error) {
            console.error('Error deleting event:', error);
            setErrorDeleteEvent(error.message || 'Failed to delete event.');
        } finally {
            setLoadingDeleteEvent(false);
        }
    };

    const handleDeleteParticipant = async (participantId, participantName) => {
         if (!confirm(`Are you sure you want to delete participant "${participantName}"?`)) {
             return;
         }

         setDeletingParticipantId(participantId);
         setErrorDeleteParticipant(null);

         try {
             await deleteParticipantAsAdmin(participantId, edit_uuid);
             setParticipants(participants.filter(p => p.id !== participantId));
             alert(`Participant "${participantName}" deleted successfully.`);

         } catch (error) {
             console.error(`Error deleting participant ${participantId}:`, error);
             const errorMessage = error.response?.data?.detail || error.message || `Failed to delete participant "${participantName}".`;
             setErrorDeleteParticipant(errorMessage);
         } finally {
             setDeletingParticipantId(null);
         }
    };

    const handleDeleteGenericInvitation = async (invitationUuid) => {
        if (!confirm('Are you sure you want to delete this generic invitation link? It will no longer be usable.')) {
            return;
        }
        setDeletingGenericInvitationUuid(invitationUuid);
        setErrorDeleteGenericInvitation(null);
        try {
            await deleteGenericInvitation(invitationUuid, edit_uuid);
            setGenericInvitations(genericInvitations.filter(inv => inv.uuid !== invitationUuid));
            alert('Generic invitation deleted successfully.');
        } catch (error) {
             console.error(`Error deleting generic invitation ${invitationUuid}:`, error);
             const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete generic invitation.';
             setErrorDeleteGenericInvitation(errorMessage);
        } finally {
             setDeletingGenericInvitationUuid(null);
        }
    };

    const handleDeletePersonalizedInvitation = async (invitationUuid, participantName) => {
         if (!confirm(`Are you sure you want to delete the invitation for "${participantName}"?`)) {
             return;
         }
         setDeletingPersonalizedInvitationUuid(invitationUuid);
         setErrorDeletePersonalizedInvitation(null);
         try {
             await deletePersonalizedInvitation(invitationUuid, edit_uuid);
              // Update list locally
             setPersonalizedInvitations(personalizedInvitations.filter(inv => inv.uuid !== invitationUuid));
             alert(`Invitation for "${participantName}" deleted successfully.`);
         } catch (error) {
              console.error(`Error deleting personalized invitation ${invitationUuid}:`, error);
              const errorMessage = error.response?.data?.detail || error.message || `Failed to delete invitation for "${participantName}".`;
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
         setErrorAddGeneric(null);
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

        if (!addPersonalizedFormData.name) {
            setErrorAddPersonalized('Please enter a name for the personalized invitation.');
            setLoadingAddPersonalized(false);
            return;
        }

        try {
            const response = await createPersonalizedInvitation(
                uuid,
                edit_uuid,
                addPersonalizedFormData.name,
            );
            console.log('Personalized invitation created:', response);

            if (response && response.uuid) {
                 const invitationLink = `${window.location.origin}/personalized-invitation/accept/${response.uuid}`;
                 setCreatedPersonalizedLink(invitationLink);
                 setPersonalizedInvitations(prev => [...prev, response]);
                 setAddPersonalizedFormData({ name: '' });

            } else {
                console.error('API response missing invitation UUID:', response);
                setErrorAddPersonalized('Failed to create personalized invitation. Invalid response from server.');
            }

            await fetchEventData();

        } catch (error) {
            console.error('Error creating personalized invitation:', error);
             const errorMessage = error.response?.data?.detail || error.message || 'Failed to create personalized invitation.';
            setErrorAddPersonalized(errorMessage);
        } finally {
            setLoadingAddPersonalized(false);
        }
    };

    const handleCreateGenericInvitation = async () => {
         if (genericInvitations.length > 0) {
              setErrorAddGeneric("A generic invitation link already exists for this event.");
              return;
         }

         setLoadingAddGeneric(true);
         setErrorAddGeneric(null);
         try {
             const response = await createGenericInvitation(uuid, edit_uuid);
             console.log('Generic invitation created:', response);
             alert('Generic invitation link created!');

            await fetchEventData();


         } catch (error) {
             console.error('Error creating generic invitation:', error);
             const errorMessage = error.response?.data?.detail || error.message || 'Failed to create generic invitation link.';
             setErrorAddGeneric(errorMessage);
         } finally {
             setLoadingAddGeneric(false);
         }
    };

    const copyToClipboard = (text, message) => {
         navigator.clipboard.writeText(text).then(() => {
             alert(message || 'Link copied to clipboard!');
         }).catch(err => {
             console.error('Failed to copy text: ', err);
             alert('Failed to copy link.');
         });
    };

    const currentGenericLink = genericInvitations.length > 0 ?
        `${window.location.origin}/invitation/accept/${genericInvitations[0].uuid}` : null;


    const isMainActionLoading = loadingSave || loadingDeleteEvent || deletingParticipantId !== null || deletingGenericInvitationUuid !== null || deletingPersonalizedInvitationUuid !== null;

    const isAddModalLoading = loadingAddPersonalized || loadingAddGeneric;

    const handleDeleteComment = async (commentUuid, authorName) => {
        if (!confirm(`Are you sure you want to delete the comment by "${authorName}"?`)) {
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
            const errorMessage = error.response?.data?.detail || error.message || `Failed to delete comment by "${authorName}".`;
            setErrorDeleteComment(errorMessage);
        } finally {
            setDeletingCommentId(null);
        }
    };

    const formatDateTime = (datetimeString) => {
        if (!datetimeString) return 'N/A';
        try {
            const date = new Date(datetimeString);
            if (isNaN(date.getTime())) {
                return datetimeString;
            }
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return date.toLocaleString(undefined, options);
        } catch (e) {
            console.error("Error formatting date:", e);
            return datetimeString;
        }
    };

    if (loadingFetch) {
        return <div className={styles.container}>Loading event for editing...</div>;
    }

    if (errorFetch) {
        return <div className={`${styles.container} ${styles.error}`}>Error loading event: {errorFetch}</div>;
    }


    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Edit Event: {formData.name || 'Event'}</h1>
            {errorSave && <div className={styles.error}>{errorSave}</div>}
            {errorDeleteEvent && <div className={styles.error}>{errorDeleteEvent}</div>}
            {errorDeleteParticipant && <div className={styles.error}>{errorDeleteParticipant}</div>}
            {errorDeleteGenericInvitation && <div className={styles.error}>{errorDeleteGenericInvitation}</div>}
            {errorDeletePersonalizedInvitation && <div className={styles.error}>{errorDeletePersonalizedInvitation}</div>}
            {errorDeleteComment && <div className={styles.error}>{errorDeleteComment}</div>}

            <form id="editEventForm" onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Event Name*</label>
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
                    <label className={styles.label}>Location*</label>
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
                        <label className={styles.label}>Start Date & Time*</label>
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
                        <label className={styles.label}>End Date & Time*</label>
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
                    <label className={styles.label}>Organizer Email*</label>
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
                    <label className={styles.label}>Organizer Name</label>
                    <input
                        type="text"
                        name="organizer_name"
                        value={formData.organizer_name}
                        onChange={handleChange}
                        className={styles.input}
                    />
                </div>


                <div className={styles.formGroup}>
                    <label className={styles.label}>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className={styles.textarea}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>External Link</label>
                    <input
                        type="url"
                        name="link"
                        value={formData.link}
                        onChange={handleChange}
                        className={styles.input}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Event Image</label>
                    {(imagePreview || formData.current_image_url) && (
                        <div className={styles.imagePreviewContainer}>
                            <img src={imagePreview || formData.current_image_url} alt="Image Preview" className={styles.imagePreview} />
                        </div>
                    )}
                    <input
                        type="file"
                        name="image"
                        onChange={handleChange}
                        className={styles.fileInput}
                        accept="image/*"
                    />
                        <small className={styles.helpText}>Select a new image to replace the current one.</small>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Participants Limit</label>
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
                <h2>Participants ({participants.length})</h2>
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
                                    {deletingParticipantId === participant.id ? 'Deleting...' : 'Delete'}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No participants have joined yet.</p>
                )}
            </div>

            {/* --- Comments Section --- */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>Comments ({comments.length})</h2>
                    <button
                        className={styles.toggleButton}
                        onClick={() => setShowComments(!showComments)}
                        aria-label={showComments ? "Hide comments" : "Show comments"}
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
                                            <strong>{comment.author}</strong>
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
                                            {deletingCommentId === comment.uuid ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No comments yet.</p>
                        )}
                    </>
                )}
            </div>


            {/* --- Invitations Section --- */}
            <div className={styles.section}>

                {/* Generic Invitations */}
                <h3>Universal Invitation Link</h3>
                {genericInvitations.length > 0 ? (
                    <ul className={styles.invitationList}>
                        {genericInvitations.map(invitation => (
                            <li key={invitation.uuid} className={styles.invitationItem}>
                                <span>
                                    Link: <Link href={`/invitation/accept/${invitation.uuid}`} target="_blank" rel="noopener noreferrer">
                                        {`${window.location.origin}/invitation/accept/${invitation.uuid}`}
                                    </Link>
                                </span>
                                <button
                                    className={styles.copyLinkButton}
                                    onClick={() => copyToClipboard(`${window.location.origin}/invitation/accept/${invitation.uuid}`, 'Generic link copied!')}
                                >
                                    Copy Link
                                </button>
                                <button
                                    className={styles.deleteInvitationButton}
                                    onClick={() => handleDeleteGenericInvitation(invitation.uuid)}
                                    disabled={deletingGenericInvitationUuid === invitation.uuid || isMainActionLoading || isAddModalLoading}
                                >
                                    {deletingGenericInvitationUuid === invitation.uuid ? 'Deleting...' : 'Delete Link'}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No universal invitation link has been created yet.</p>
                )}

                {/* Personalized Invitations */}
                <h3>Personalized Invitations ({personalizedInvitations.length})</h3>
                {personalizedInvitations.length > 0 ? (
                    <ul className={styles.invitationList}>
                        {personalizedInvitations.map(invitation => (
                            <li key={invitation.uuid} className={styles.invitationItem}>
                                 <span>
                                     <strong>{invitation.name}</strong>
                                 </span>
                                 <button
                                     className={styles.copyLinkButton}
                                     onClick={() => copyToClipboard(`${window.location.origin}/personalized-invitation/accept/${invitation.uuid}`, `Link for ${invitation.name} copied!`)}
                                     disabled={deletingPersonalizedInvitationUuid === invitation.uuid || isMainActionLoading || isAddModalLoading}
                                 >
                                     Copy Link
                                 </button>
                                 <button
                                    className={styles.deleteInvitationButton}
                                    onClick={() => handleDeletePersonalizedInvitation(invitation.uuid, invitation.name || invitation.email || 'Unnamed Invitation')}
                                    disabled={deletingPersonalizedInvitationUuid === invitation.uuid || isMainActionLoading || isAddModalLoading}
                                 >
                                     {deletingPersonalizedInvitationUuid === invitation.uuid ? 'Deleting...' : 'Delete'}
                                 </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No personalized invitations have been sent yet.</p>
                )}
                <button
                    onClick={openAddParticipantModal}
                    className={styles.submitButton}
                    disabled={isMainActionLoading || isAddModalLoading}
                >
                    Add New Participant / Invitation
                </button>

                <button
                    type="submit"
                    form={"editEventForm"}
                    className={styles.submitButton}
                    // onClick={handleSubmit}
                    disabled={loadingSave || loadingDeleteEvent}
                >
                    {loadingSave ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                    className={styles.deleteButton}
                    onClick={handleDeleteEvent}
                    disabled={loadingSave || loadingDeleteEvent}
                >
                    {loadingDeleteEvent ? 'Deleting...' : 'Delete Event'}
                </button>
            </div>

            {/* --- Add Participant Modal --- */}
            {showAddParticipantModal && (
                <div className={modalStyles.modalOverlay} onClick={closeAddParticipantModal}>
                    <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}> {/* Prevent clicks inside closing the modal */}
                        <button className={modalStyles.closeButton} onClick={closeAddParticipantModal}>×</button>
                        <h2>Add Participant or Invitation</h2>

                        {isAddModalLoading && <div className={modalStyles.loading}>Processing...</div>}
                        {errorAddPersonalized && <div className={modalStyles.error}>{errorAddPersonalized}</div>}
                        {errorAddGeneric && <div className={modalStyles.error}>{errorAddGeneric}</div>}

                        <div className={modalStyles.section}>
                            <h3>Send Personalized Invitation</h3>
                            {createdPersonalizedLink ? (
                               <div className={modalStyles.genericLinkBox}>
                                    <strong>Personalized Invitation Link:</strong>
                                    <p>
                                        <Link href={createdPersonalizedLink} target="_blank" rel="noopener noreferrer">
                                            {createdPersonalizedLink}
                                        </Link>
                                    </p>
                                    <small>Share this link directly with the person.</small>
                                    <button
                                        className={modalStyles.copyLinkButton}
                                        onClick={() => copyToClipboard(createdPersonalizedLink, 'Personalized link copied!')}
                                    >
                                        Copy Link
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
                                        Send Another Invitation
                                    </button>
                               </div>
                           ) : (
                               <>
                                <p>Create an invitation link for a specific person by name.</p>
                                <form onSubmit={handleAddPersonalizedSubmit} className={modalStyles.form}>
                                    <div className={modalStyles.formGroup}>
                                        <label className={modalStyles.label}>Name</label>
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
                                    <button type="submit" className={modalStyles.submitButton} disabled={isAddModalLoading || !addPersonalizedFormData.name.trim()}> {/* Disable if name is empty */}
                                        {loadingAddPersonalized ? 'Creating...' : 'Create Personalized Link'}
                                    </button>
                                </form>
                               </>
                           )}
                        </div>

                        <div className={modalStyles.section}>
                            <h3>Generic Invitation Link</h3>
                            <p>Generate a link anyone can use to sign up for this event. (Only one generic link per event)</p>

                            {currentGenericLink ? (
                                <div className={modalStyles.genericLinkBox}>
                                    <strong>Invitation Link:</strong>
                                    <p>
                                        <Link href={currentGenericLink} target="_blank" rel="noopener noreferrer">
                                            {currentGenericLink}
                                        </Link>
                                    </p>
                                    <small>Share this link. Users will enter their name and email to join.</small>
                                    <button
                                        className={modalStyles.copyLinkButton}
                                        onClick={() => navigator.clipboard.writeText(currentGenericLink).then(() => alert('Link copied!'))}
                                    >
                                        Copy Link
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleCreateGenericInvitation}
                                    className={modalStyles.createLinkButton}
                                    disabled={isAddModalLoading}
                                >
                                    {loadingAddGeneric ? 'Generating Link...' : 'Generate Generic Link'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
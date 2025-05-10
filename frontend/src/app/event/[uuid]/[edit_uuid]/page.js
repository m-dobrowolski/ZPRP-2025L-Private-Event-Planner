'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    getEventAdminDetails,
    updateEvent,
    deleteEvent,
    deleteParticipantAsAdmin,
} from '@/api/api';
import styles from './editEvent.module.css';

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

    // Loading states
    const [loadingFetch, setLoadingFetch] = useState(true);
    const [loadingSave, setLoadingSave] = useState(false);
    const [loadingDeleteEvent, setLoadingDeleteEvent] = useState(false);
    const [deletingParticipantId, setDeletingParticipantId] = useState(null);

    // Error states
    const [errorFetch, setErrorFetch] = useState(null);
    const [errorSave, setErrorSave] = useState(null);
    const [errorDeleteEvent, setErrorDeleteEvent] = useState(null);
    const [errorDeleteParticipant, setErrorDeleteParticipant] = useState(null);


    const fetchEventData = async () => {
        setLoadingFetch(true);
        setErrorFetch(null);
        setErrorDeleteParticipant(null);

        try {
            const data = await getEventAdminDetails(uuid, edit_uuid);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingSave(true);
        setErrorSave(null);

        if (!formData.name || !formData.location || !formData.start_datetime || !formData.end_datetime || !formData.organizer_email) {
            setErrorSave('Please fill in all required fields.');
            setLoadingSave(false);
            return;
        }

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
    const isMainActionLoading = loadingSave || loadingDeleteEvent || deletingParticipantId !== null;

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

            <form onSubmit={handleSubmit} className={styles.form}>
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

                <button type="submit" className={styles.submitButton} disabled={loadingSave || loadingDeleteEvent}>
                    {loadingSave ? 'Saving...' : 'Save Changes'}
                </button>
            </form>

             <button
                 className={styles.deleteButton}
                 onClick={handleDeleteEvent}
                 disabled={loadingSave || loadingDeleteEvent}
             >
                 {loadingDeleteEvent ? 'Deleting...' : 'Delete Event'}
             </button>

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
                                    disabled={deletingParticipantId === participant.id || isMainActionLoading}
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

        </div>
    );
}
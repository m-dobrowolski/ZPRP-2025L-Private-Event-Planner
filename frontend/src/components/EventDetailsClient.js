'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getEventDetails, getComments, createComment, getEventIcs } from '@/api/api';
import styles from '@/app/[locale]/event/[uuid]/eventDetail.module.css';
import { useTranslation } from 'react-i18next';

export default function EventDetailsClient({ uuid: uuidProp }) {
    const params = useParams();
    const searchParams = useSearchParams();
    const uuid = uuidProp || params.uuid;
    const authorUuid = searchParams.get('author_uuid');

    const { t } = useTranslation('translation');

    const [eventData, setEventData] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [popupError, setPopupError] = useState(null);
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [newComment, setNewComment] = useState({ content: '' });
    const [submittingComment, setSubmittingComment] = useState(false);
    const [sortOrder, setSortOrder] = useState('newest');

    useEffect(() => {
        if (!uuid) return;

        const fetchEventAndComments = async () => {
            setLoading(true);
            setError(null);
            try {
                const [eventData, commentsData] = await Promise.all([
                    getEventDetails(uuid),
                    getComments(uuid)
                ]);
                setEventData(eventData);
                setParticipants(eventData.participants || []);
                const sortedComments = [...(commentsData || [])].sort((a, b) => {
                    return new Date(b.date) - new Date(a.date);
                });
                setComments(sortedComments);
            } catch (err) {
                setError(err.message || t('fetch_event_failed_error'));
                console.error('Error fetching event:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEventAndComments();
    }, [uuid, t]);

    const formatDateTime = (datetimeString) => {
        if (!datetimeString) return t('not_available_abbr');
        try {
            const date = new Date(datetimeString);
            if (isNaN(date.getTime())) {
                return datetimeString;
            }
            return t('datetime_format', { date, formatParams: { date: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' } } });

        } catch (e) {
            console.error("Error formatting date:", e);
            return datetimeString;
        }
    };

    const showErrorPopup = (message) => {
        setPopupError(message);
        setTimeout(() => setPopupError(null), 3000);
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        setSubmittingComment(true);
        // setPopupError(null);
        //
        // if (!newComment.author_uuid || !newComment.content) {
        //     showErrorPopup(t('comment_fields_required_error'));
        //     setSubmittingComment(false);
        //     return;
        // }

        try {
            await createComment(uuid, authorUuid, newComment.content);
            const updatedComments = await getComments(uuid);
            // Sort the comments according to current sort order
            const sortedComments = [...updatedComments].sort((a, b) => {
                if (sortOrder === 'newest') {
                    return new Date(b.date) - new Date(a.date);
                } else {
                    return new Date(a.date) - new Date(b.date);
                }
            });
            setComments(sortedComments);
            setNewComment({ content: '' });
            setShowCommentForm(false);
        } catch (err) {
            const errorMessage = err.message || t('add_comment_failed_error');
            showErrorPopup(errorMessage);
            console.error('Error adding comment:', err);
        } finally {
            setSubmittingComment(false);
        }
    };

    const sortComments = (order) => {
        setSortOrder(order);
        const sortedComments = [...comments].sort((a, b) => {
            if (order === 'newest') {
                return new Date(b.date) - new Date(a.date);
            } else {
                return new Date(a.date) - new Date(b.date);
            }
        });
        setComments(sortedComments);
    };

    const exportEventICS = async () => {
        try {
            const icsData = await getEventIcs(uuid);
            const blob = new Blob([icsData], { type: 'text/calendar' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'event.ics';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            showErrorPopup('Failed to export ICS file.');
            console.error('Failed to export ICS: ', err);
        }
    }

    if (loading) {
        return <div className={styles.container}>{t('loading_event')}</div>;
    }

    if (error) {
        return <div className={`${styles.container} ${styles.error}`}>{t('error_prefix')}: {error}</div>;
    }

    if (!eventData) {
        return <div className={styles.container}>{t('event_not_found')}</div>;
    }

    return (
        <div className={styles.container}>
            {popupError && (
                <div className={styles.errorPopup}>
                    {popupError}
                </div>
            )}
            <h1 className={styles.title}>{eventData.name}</h1>

            {/* Display current image if available */}
            {eventData.image && (
                <div className={styles.imageContainer}>
                    <img src={eventData.image} alt={eventData.name || t('event_image_alt')} className={styles.image} />
                </div>
            )}

            <div className={styles.eventTimeLocationDetails}>
                <div className={styles.eventDetailsLeft}>
                    <div className={styles.detailItem}>
                        <strong>{t('location_label')}:</strong> {eventData.location}
                    </div>
                    <div className={styles.detailItem}>
                        <strong>{t('start_datetime_label')}:</strong> {formatDateTime(eventData.start_datetime)}
                    </div>
                    <div className={styles.detailItem}>
                        <strong>{t('end_datetime_label')}:</strong> {formatDateTime(eventData.end_datetime)}
                    </div>
                </div>
                <div className={styles.eventDetailsRight}>
                    <div className={styles.rightDetailsButton}>
                        <a
                            href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventData.name)}&dates=${new Date(eventData.start_datetime).toISOString().replace(/-|:|\.\d+/g, '')}/${new Date(eventData.end_datetime).toISOString().replace(/-|:|\.\d+/g, '')}&details=${encodeURIComponent(eventData.description || '')}&location=${encodeURIComponent(eventData.location || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Add to Google Calendar
                        </a>
                    </div>
                    <div className={styles.rightDetailsButton}>
                       <button onClick={exportEventICS}>Export as ICS</button>
                    </div>
                </div>
            </div>

            {eventData.organizer_name && (
                <div className={styles.detailItem}>
                    <strong>{t('organizer_name_label')}:</strong> {eventData.organizer_name}
                </div>
            )}
            {eventData.organizer_email && (
                <div className={styles.detailItem}>
                    <strong>{t('organizer_email_label')}:</strong> {eventData.organizer_email}
                </div>
            )}
            {eventData.description && (
                <div className={styles.detailItem}>
                    <strong>{t('description_label')}:</strong> <p>{eventData.description}</p>
                </div>
            )}
            {eventData.link && (
                <div className={styles.detailItem}>
                    <strong>{t('more_info_label')}:</strong> <a href={eventData.link} target="_blank" rel="noopener noreferrer">{eventData.link}</a>
                </div>
            )}
            {eventData.participants_limit !== null && eventData.participants_limit !== undefined && eventData.participants_limit !== '' && (
                <div className={styles.detailItem}>
                    <strong>{t('participants_limit_label')}:</strong> {eventData.participants_limit}
                </div>
            )}

            <div className={styles.section}>
                <h2>{t('participants_heading', { count: participants.length })}</h2>
                {participants.length > 0 ? (
                    <ul className={styles.participantList}>
                        {participants.map((participant, index) => (
                            <li key={participant.id || index} className={styles.participantItem}>
                                <span>
                                    {participant.name} {participant.email ? `(${participant.email})` : ''}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>{t('no_participants_yet')}</p>
                )}
            </div>

            <div className={styles.section}>
                <h2>{t('comments_heading', { count: comments.length })}</h2>
                {authorUuid && (
                    <button
                        className={styles.addCommentButton}
                        onClick={() => setShowCommentForm(!showCommentForm)}
                    >
                        {showCommentForm ? t('cancel_comment_button') : t('add_comment_button')}
                    </button>
                )}

                {showCommentForm && authorUuid && (
                    <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                        <div className={styles.formGroup}>
                            <label htmlFor="content">{t('comment_label')}:</label>
                            <textarea
                                id="content"
                                value={newComment.content}
                                onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
                                required
                                className={styles.textarea}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submittingComment}
                            className={styles.submitButton}
                        >
                            {submittingComment ? t('submitting_comment_button') : t('submit_comment_button')}
                        </button>
                    </form>
                )}

                <div className={styles.sortControls}>
                    <button
                        className={`${styles.sortButton} ${sortOrder === 'newest' ? styles.active : ''}`}
                        onClick={() => sortComments('newest')}
                    >
                        {t('newest_first_sort')}
                    </button>
                    <button
                        className={`${styles.sortButton} ${sortOrder === 'oldest' ? styles.active : ''}`}
                        onClick={() => sortComments('oldest')}
                    >
                        {t('oldest_first_sort')}
                    </button>
                </div>

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
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>{t('no_comments_yet')}</p>
                )}
            </div>
        </div>
    );
}
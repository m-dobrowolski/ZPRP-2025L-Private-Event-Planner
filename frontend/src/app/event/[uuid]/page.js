'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getEventDetails } from '@/api/api';
import styles from './eventDetail.module.css';

export default function EventDetailPage() {
    const params = useParams();
    const uuid = params.uuid;

    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!uuid) return;

        const fetchEvent = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getEventDetails(uuid);
                setEventData(data);
            } catch (err) {
                setError(err.message || 'Failed to fetch event details.');
                console.error('Error fetching event:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [uuid]);

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


    if (loading) {
        return <div className={styles.container}>Loading event...</div>;
    }

    if (error) {
        return <div className={`${styles.container} ${styles.error}`}>Error: {error}</div>;
    }

    if (!eventData) {
        return <div className={styles.container}>Event not found or could not be loaded.</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{eventData.name}</h1>

            {/* Display current image if available */}
            {eventData.image && (
                <div className={styles.imageContainer}>
                    {/* Assuming eventData.image is a URL? */}
                    <img src={eventData.image} alt={eventData.name || 'Event Image'} className={styles.image} />
                </div>
            )}

            <div className={styles.detailItem}>
                <strong>Location:</strong> {eventData.location}
            </div>
            <div className={styles.detailItem}>
                <strong>Start Time:</strong> {formatDateTime(eventData.start_datetime)}
            </div>
            <div className={styles.detailItem}>
                <strong>End Time:</strong> {formatDateTime(eventData.end_datetime)}
            </div>
            {eventData.organizer_name && (
                 <div className={styles.detailItem}>
                    <strong>Organizer:</strong> {eventData.organizer_name}
                 </div>
            )}
             {eventData.organizer_email && (
                 <div className={styles.detailItem}>
                    <strong>Organizer Email:</strong> {eventData.organizer_email}
                 </div>
             )}
            {eventData.description && (
                 <div className={styles.detailItem}>
                    <strong>Description:</strong> <p>{eventData.description}</p>
                 </div>
             )}
             {eventData.link && (
                 <div className={styles.detailItem}>
                    <strong>More Info:</strong> <a href={eventData.link} target="_blank" rel="noopener noreferrer">{eventData.link}</a>
                 </div>
             )}
            {eventData.participants_limit !== null && eventData.participants_limit !== undefined && eventData.participants_limit !== '' && (
                 <div className={styles.detailItem}>
                    <strong>Participants Limit:</strong> {eventData.participants_limit}
                 </div>
             )}
             {/* Maybe add participant list here */}
        </div>
    );
}
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { acceptGenericInvitation, getGenericInvitationDetails } from '@/api/api';
import styles from '@/styles/acceptInvitation.module.css';

import Link from 'next/link';

export default function AcceptInvitationPage() {
    const params = useParams();
    const invitationUuid = params.uuid;

    const router = useRouter();

    const [formData, setFormData] = useState({ name: '', email: '' });
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [error, setError] = useState(null);
    const [errorDetails, setErrorDetails] = useState(null);
    const [eventDetails, setEventDetails] = useState(null);
    const [success, setSuccess] = useState(null);


     useEffect(() => {
         if (!invitationUuid) {
             setLoadingDetails(false);
             return;
         }

         const fetchEventContext = async () => {
             setLoadingDetails(true);
             setErrorDetails(null);
             try {
                 const data = await getGenericInvitationDetails(invitationUuid);

                 if (data && data.event_name && data.event_uuid) {
                     setEventDetails({ name: data.event_name, uuid: data.event_uuid });
                 } else {
                      console.error("API returned unexpected data structure:", data);
                      setErrorDetails("Could not load event details due to an unexpected response.");
                 }

             } catch (err) {
                  console.error("Failed to fetch event context for generic invitation:", err);
                  const errorMessage = err.message || "Could not load event details for this invitation.";
                  setErrorDetails(errorMessage);
             } finally {
                 setLoadingDetails(false);
             }
         };

         fetchEventContext();

     }, [invitationUuid]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!formData.name || !formData.email) {
            setError('Please enter your name and email to join.');
            setLoading(false);
            return;
        }

        if (!invitationUuid) {
             setError('Invalid invitation link.');
             setLoading(false);
             return;
        }

        try {
            const response = await acceptGenericInvitation(invitationUuid, formData.name, formData.email);

            console.log('Invitation accepted, participant created:', response);
            setSuccess({
                uuid: response.uuid,
                event: response.event
            });

            // get rid of redirection, user must have time to save displayed url

            // if (response && response.event) {
            //     router.push(`/event/${response.event}`);
            // } else {
            //      console.warn("Backend did not return event_uuid on generic invitation acceptance.");
            //      router.push('/');
            // }

        } catch (err) {
            console.error('Error accepting invitation:', err);
            const errorMessage = err.message || 'Failed to accept invitation.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

     if (params.uuid === undefined) {
     }

    if (loadingDetails) {
         return <div className={styles.container}>Loading invitation details...</div>;
    }

    if (errorDetails) {
         return <div className={`${styles.container} ${styles.error}`}>Error loading invitation: {errorDetails}</div>;
    }

    if (!eventDetails && !loadingDetails && !errorDetails) {
        return <div className={`${styles.container} ${styles.error}`}>Invalid or expired invitation link.</div>;
    }


    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Accept Event Invitation</h1>

            {eventDetails && (
                <div className={styles.eventContext}>
                    <p>You've been invited to: <strong>{eventDetails.name}</strong></p>
                </div>
            )}

            {error && <div className={styles.error}>{error}</div>}
            {success && (
                <div className={styles.success}>
                    <h2>Success! You have joined the event.</h2>
                    <p>
                        Your URL: <br />
                        <div className={styles.link}>
                            <Link href={`/event/${success.event}?author_uuid=${success.uuid}`}>
                                http://localhost:3000/api/event/{success.event}?author_uuid={success.uuid}
                            </Link>
                        </div>
                    </p>
                    <p className={styles.important}>IMPORTANT: Please save this URL as it can only be accessed once. It will be needed to comment on the event.</p>
                </div>
            )}

            {!success && eventDetails && (
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="name" className={styles.label}>Your Name</label>
                        <input
                            id="name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={styles.input}
                            required
                            disabled={loading || loadingDetails}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>Your Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={styles.input}
                            required
                            disabled={loading || loadingDetails}
                        />
                    </div>
                    <button type="submit" className={styles.submitButton} disabled={loading || loadingDetails}>
                        {loading ? 'Joining...' : 'Join Event'}
                    </button>
                </form>
            )}
        </div>
    );
}
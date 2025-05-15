'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { acceptGenericInvitation, getGenericInvitationDetails } from '@/api/api';
import styles from '@/styles/acceptInvitation.module.css';
import { useTranslation } from 'react-i18next';

export default function AcceptGenericInvitationClient({ invitationUuid }) {
    const router = useRouter();
    const { t } = useTranslation('translation');

    const [formData, setFormData] = useState({ name: '', email: '' });
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [error, setError] = useState(null);
    const [errorDetails, setErrorDetails] = useState(null);
    const [eventDetails, setEventDetails] = useState(null);

    useEffect(() => {
        if (!invitationUuid) {
            setLoadingDetails(false);
            setErrorDetails(t('invalid_invitation_uuid_error'));
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
                    setErrorDetails(t('load_event_details_unexpected_response_error'));
                }

            } catch (err) {
                console.error("Failed to fetch event context for generic invitation:", err);
                const errorMessage = err.message || t('load_event_details_failed_error');
                setErrorDetails(errorMessage);
            } finally {
                setLoadingDetails(false);
            }
        };

        fetchEventContext();

    }, [invitationUuid, t]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.name.trim() || !formData.email.trim()) {
            setError(t('name_email_required_error'));
            setLoading(false);
            return;
        }

        if (!invitationUuid) {
            setError(t('invalid_invitation_link_error'));
            setLoading(false);
            return;
        }

        try {
            const response = await acceptGenericInvitation(invitationUuid, formData.name.trim(), formData.email.trim());

            console.log('Invitation accepted, participant created:', response);

            const successMessage = t('generic_invitation_accepted_alert', { uuid: response.uuid });
            alert(successMessage);

            if (response && response.event) {
                router.push(`/event/${response.event}`);
            } else {
                console.warn("Backend did not return event_uuid on generic invitation acceptance.");
                router.push('/');
            }

        } catch (err) {
            console.error('Error accepting invitation:', err);
            const errorMessage = err.response?.data?.detail || err.message || t('accept_generic_failed_error');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loadingDetails) {
        return <div className={styles.container}>{t('loading_invitation_details')}</div>;
    }

    if (errorDetails) {
        return <div className={`${styles.container} ${styles.error}`}>{t('error_loading_invitation_prefix')}: {errorDetails}</div>;
    }

    if (!eventDetails && !loadingDetails && !errorDetails) {
        return <div className={`${styles.container} ${styles.error}`}>{t('invalid_expired_invitation_error')}</div>;
    }

    return (
        <div className={styles.container}>

            <h1 className={styles.title}>{t('accept_generic_invitation_title')}</h1>

            {eventDetails && (
                <div className={styles.eventContext}>
                    <p>{t('invited_to_event', { eventName: eventDetails.name })}</p>
                </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.label}>{t('your_name_label')}</label>
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
                    <label htmlFor="email" className={styles.label}>{t('your_email_label')}</label>
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
                <button type="submit" className={styles.submitButton} disabled={loading || loadingDetails || !formData.name.trim() || !formData.email.trim()}>
                    {loading ? t('joining_button') : t('join_event_button')}
                </button>
            </form>
        </div>
    );
}
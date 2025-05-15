'use client';

import { useState } from 'react';
import { createEvent } from '@/api/api';
import styles from '@/app/[locale]/create-event/createEvent.module.css';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function CreateEventForm() {
    const { t } = useTranslation('translation');

    const [successData, setSuccessData] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        start_datetime: '',
        end_datetime: '',
        organizer_email: '',
        description: '',
        link: '',
        image: null,
        organizer_name: '',
        participants_limit: '',
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: files ? files[0] : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const formDataToSend = new FormData();
            for (const key in formData) {
                if (formData[key] !== null && formData[key] !== '') {
                    formDataToSend.append(key, formData[key]);
                }
            }

            const res = await createEvent(formDataToSend);
            const { uuid, edit_uuid } = res;
            setSuccessData({ uuid, edit_uuid });
        } catch (error) {
            console.error('Error creating event:', error);
        }
    };

    if (successData) {
        return (
            <div className={styles.success_container}>
                <h1 className={styles.title}>{t('create_event_success_title')}</h1>
                <p>
                    {t('create_event_success_message')}
                </p>

                <div className={styles.link_row}>
                    <div className={styles.link_description}>
                        {t('access_link_label')}:
                    </div>
                    <div className={styles.link}>
                        <Link href={`/event/${successData.uuid}`}>
                            {`http://localhost:3000/event/${successData.uuid}`}
                        </Link>
                    </div>
                </div>

                <div className={styles.link_row}>
                    <div className={styles.link_description}>
                        {t('manage_link_label')}:
                    </div>
                    <div className={styles.link}>
                        <Link href={`/event/${successData.uuid}/${successData.edit_uuid}`}>
                            {`http://localhost:3000/event/${successData.uuid}/${successData.edit_uuid}`}
                        </Link>
                    </div>
                </div>

            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{t('create_page_title')}</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
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
                    <input
                        type="file"
                        name="image"
                        onChange={handleChange}
                        className={styles.fileInput}
                        accept="image/*"
                    />
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

                <button type="submit" className={styles.submitButton}>
                    {t('create_button_text')}
                </button>
            </form>
        </div>
    );
}
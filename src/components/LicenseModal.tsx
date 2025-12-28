import { useState } from 'react';
import { licenseText } from '../licenseText';
import './LicenseModal.css';

interface LicenseModalProps {
    onClose: () => void;
}

export const LicenseModal = ({ onClose }: LicenseModalProps) => {
    const [showFullAGPL, setShowFullAGPL] = useState(false);

    // Process license text: split into paragraphs, remove hard line breaks within paragraphs
    const processedText = licenseText
        .split('\n\n')
        .map(para => para.replace(/\n/g, ' ').trim())
        .filter(para => para.length > 0);

    return (
        <div className="license-container">
            <div className="license-header">
                <h1>Licenses</h1>
                <button className="close-license-button" onClick={onClose}>
                    ✕ Close
                </button>
            </div>

            <div className="license-content">
                <section className="license-section">
                    <h2>Application</h2>
                    <p>
                        <strong>GNU Affero General Public License v3.0 (AGPL-3.0)</strong>
                    </p>
                    <p>
                        This application is free software: you can redistribute it and/or modify
                        it under the terms of the GNU Affero General Public License as published
                        by the Free Software Foundation, either version 3 of the License, or
                        (at your option) any later version.
                    </p>
                    <button
                        className="expand-license-button"
                        onClick={() => setShowFullAGPL(!showFullAGPL)}
                    >
                        {showFullAGPL ? '▼ Hide Full AGPL-3.0 License' : '▶ Show Full AGPL-3.0 License'}
                    </button>

                    {showFullAGPL && (
                        <div className="license-text-wrapper">
                            {processedText.map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                    )}
                </section>

                <section className="license-section">
                    <h2>Card Face Images</h2>
                    <p>
                        <strong>Public Domain</strong>
                    </p>
                    <p>
                        Card face images by Byron Knoll from the{' '}
                        <a
                            href="https://commons.wikimedia.org/wiki/Category:SVG_English_pattern_playing_cards"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            SVG English pattern playing cards collection
                        </a>
                        {' '}on Wikimedia Commons. These images are in the public domain.
                    </p>
                </section>
            </div>
        </div>
    );
};

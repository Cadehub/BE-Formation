import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Certificate, Formation, Inscription } from '../types';
import { Loader2, ExternalLink, Pencil, Trash2, Award, Send } from 'lucide-react';

type Props = {
    formations: Formation[];
    inscriptions: Inscription[];
};

export function AdminCertificatesList({ formations, inscriptions }: Props) {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCert, setEditingCert] = useState<Certificate | null>(null);
    const [editInscriptionId, setEditInscriptionId] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const [publishingId, setPublishingId] = useState<string | null>(null);

    useEffect(() => {
        fetchCertificates();
    }, []);

    const eligibleInscriptions = useMemo(() => {
        return inscriptions.filter((inscription) =>
            ['registered', 'fully_paid', 'paid_online'].includes(inscription.status)
        );
    }, [inscriptions]);

    const fetchCertificates = async () => {
        setLoading(true);
        const { data } = await supabase.from('certificates').select('*').order('created_at', { ascending: false });
        if (data) {
            setCertificates(data);
        }
        setLoading(false);
    };

    const replaceCertificate = (updatedCertificate: Certificate) => {
        setCertificates((previous) =>
            previous.map((certificate) =>
                certificate.id === updatedCertificate.id ? updatedCertificate : certificate
            )
        );
    };

    const getLinkedInscription = (certificate: Certificate) => {
        return inscriptions.find((inscription) => inscription.id === certificate.inscription_id) || null;
    };

    const getFormationLabel = (certificate: Certificate) => {
        if (certificate.formation_title) return certificate.formation_title;

        const linkedInscription = getLinkedInscription(certificate);
        const linkedFormation = formations.find((formation) => formation.id === linkedInscription?.formation_id);
        return linkedFormation?.title || 'Formation inconnue';
    };

    const handleDelete = async (certificate: Certificate) => {
        if (!confirm('Voulez-vous vraiment supprimer ce certificat ?')) return;

        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token;
            const res = await fetch(`/api/admin/certificates/${certificate.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setCertificates((previous) => previous.filter((item) => item.id !== certificate.id));
            } else {
                const { error } = await res.json();
                alert('Erreur de suppression: ' + error);
            }
        } catch (_err) {
            alert('Erreur serveur lors de la suppression.');
        }
    };

    const handlePublish = async (certificate: Certificate) => {
        setPublishingId(certificate.id);
        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token;
            const res = await fetch(`/api/admin/certificates/${certificate.id}/publish`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Publication impossible');
            }

            replaceCertificate(data.certificate);
            alert('Certificat publié.');
        } catch (err: any) {
            alert(`Erreur de publication: ${err.message}`);
        } finally {
            setPublishingId(null);
        }
    };

    const handleEditSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingCert || !editInscriptionId) return;
        setModalLoading(true);

        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token;
            const res = await fetch(`/api/admin/certificates/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: editingCert.id,
                    inscription_id: editInscriptionId,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Mise à jour impossible');
            }

            replaceCertificate(data.certificate);
            setEditingCert(null);
            setEditInscriptionId('');
        } catch (err: any) {
            alert(`Erreur lors de la mise à jour: ${err.message}`);
        } finally {
            setModalLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin opacity-50" /></div>;
    }

    return (
        <div className="space-y-4">
            {certificates.map((certificate) => {
                const linkedInscription = getLinkedInscription(certificate);
                const canPublish = !!certificate.file_url && !!certificate.inscription_id && !certificate.is_published;

                return (
                    <div key={certificate.id} className="p-4 border border-[var(--border)] bg-[var(--background)] rounded-xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between group">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">
                                    {certificate.student_name || linkedInscription?.full_name || 'Élève inconnu'}
                                    {certificate.is_sample && (
                                        <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">TEST</span>
                                    )}
                                </p>
                                <p className="text-xs opacity-60 truncate w-48 md:w-72">{getFormationLabel(certificate)}</p>
                                <p className="text-[10px] font-mono opacity-40">{certificate.unique_id || certificate.id}</p>
                                {linkedInscription && (
                                    <p className="text-[10px] opacity-50">Inscription liée: {linkedInscription.full_name} · {linkedInscription.phone}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                certificate.is_published
                                    ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }`}>
                                {certificate.is_published ? 'Publié' : 'Brouillon'}
                            </span>
                            {certificate.file_url ? (
                                <a href={certificate.file_url} target="_blank" rel="noreferrer" className="p-2 hover:bg-[var(--foreground)]/5 rounded-lg transition-colors border border-transparent hover:border-[var(--border)]" title="Voir PDF">
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            ) : (
                                <span className="text-[10px] opacity-40 px-2">PDF manquant</span>
                            )}
                            <button
                                onClick={() => handlePublish(certificate)}
                                disabled={!canPublish || publishingId === certificate.id}
                                className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-2"
                                title="Publier le certificat"
                            >
                                {publishingId === certificate.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                <span>Publier</span>
                            </button>
                            <button
                                onClick={() => {
                                    setEditingCert(certificate);
                                    setEditInscriptionId(certificate.inscription_id || eligibleInscriptions[0]?.id || '');
                                }}
                                className="p-2 hover:bg-blue-500/10 hover:text-blue-500 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
                                title="Modifier"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(certificate)}
                                className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                title="Supprimer"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })}

            {certificates.length === 0 && <p className="text-sm opacity-50 py-4 text-center">Aucun certificat dans la base de données.</p>}

            {editingCert && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-2xl w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Rattacher le certificat à une inscription</h3>
                        <form onSubmit={handleEditSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase opacity-70 mb-2">Inscription</label>
                                <select
                                    required
                                    value={editInscriptionId}
                                    onChange={e => setEditInscriptionId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] outline-none text-sm"
                                >
                                    <option value="" disabled>Sélectionner une inscription</option>
                                    {eligibleInscriptions.map((inscription) => {
                                        const formation = formations.find((item) => item.id === inscription.formation_id);
                                        return (
                                            <option key={inscription.id} value={inscription.id}>
                                                {inscription.full_name} · {formation?.title || 'Formation inconnue'}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button type="button" onClick={() => setEditingCert(null)} className="flex-1 py-3 border border-[var(--border)] rounded-xl font-medium hover:bg-[var(--foreground)]/5 transition-colors">Annuler</button>
                                <button type="submit" disabled={modalLoading} className="flex-1 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-medium flex justify-center items-center">
                                    {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Régénérer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

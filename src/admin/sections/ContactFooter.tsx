import { useEffect, useState, useCallback } from "react";
import {
  Contact, RefreshCw, Save, Phone, Mail, MapPin, Facebook, Instagram,
  MessageCircle, Share2, FileText,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { notify } from "../ui/notify";
import {
  Panel, SectionHeader, Select, TextInput, TextArea, IconButton, PrimaryButton, FieldLabel,
} from "../ui/primitives";

const KEYS = [
  "contact.phone", "contact.email",
  "contact.address.fr", "contact.address.en", "contact.address.ar",
  "social.facebook", "social.instagram", "social.tiktok", "social.whatsapp",
  "footer.about.fr", "footer.about.en", "footer.about.ar", "footer.copyright",
  "whatsappActiveRole",
] as const;

type Values = Record<string, string>;

interface WhatsappNumbers {
  gerant: string;
  vendeur: string;
  livreur: string;
}

export function ContactFooterSection() {
  const { token } = useAuth();
  const [values, setValues] = useState<Values>({});
  const [waNumbers, setWaNumbers] = useState<WhatsappNumbers>({ gerant: "", vendeur: "", livreur: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await notify.run(() => apiFetch<Record<string, string>>("/settings", { token }), {
      error: "Échec du chargement des paramètres",
    });
    if (data) {
      const next: Values = {};
      for (const k of KEYS) next[k] = data[k] ?? "";
      if (!next["whatsappActiveRole"]) next["whatsappActiveRole"] = "gerant";
      setValues(next);
      let nums: Partial<WhatsappNumbers> = {};
      try {
        if (data["whatsappNumbers"]) nums = JSON.parse(data["whatsappNumbers"]);
      } catch { /* ignore */ }
      setWaNumbers({ gerant: nums.gerant ?? "", vendeur: nums.vendeur ?? "", livreur: nums.livreur ?? "" });
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const set = (key: string, value: string) => setValues((p) => ({ ...p, [key]: value }));

  const save = async () => {
    setSaving(true);
    const payload: Record<string, string> = { ...values };
    payload["whatsappNumbers"] = JSON.stringify(waNumbers);
    const res = await notify.run(
      () => apiFetch("/settings", { method: "PATCH", body: payload, token }),
      { success: "Paramètres enregistrés", error: "Échec de l'enregistrement" },
    );
    setSaving(false);
    if (res !== null) load();
  };

  return (
    <div>
      <SectionHeader
        title="Contact & Pied de page"
        description="Coordonnées, réseaux sociaux et configuration WhatsApp"
        icon={<Contact className="h-5 w-5" />}
        actions={
          <>
            <IconButton icon={<RefreshCw className="h-4 w-4" />} onClick={load} title="Actualiser" />
            <PrimaryButton onClick={save} loading={saving} disabled={loading}>
              <Save className="h-4 w-4" /> Enregistrer
            </PrimaryButton>
          </>
        }
      />

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Panel className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
              <Phone className="h-4 w-4 text-primary" /> Coordonnées
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput label="Téléphone" value={values["contact.phone"] ?? ""}
                onChange={(e) => set("contact.phone", e.target.value)} placeholder="+213 …" />
              <TextInput label="Email" type="email" value={values["contact.email"] ?? ""}
                onChange={(e) => set("contact.email", e.target.value)} placeholder="contact@…" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <TextInput label="Adresse (Français)" value={values["contact.address.fr"] ?? ""}
                onChange={(e) => set("contact.address.fr", e.target.value)} />
              <TextInput label="Adresse (English)" value={values["contact.address.en"] ?? ""}
                onChange={(e) => set("contact.address.en", e.target.value)} />
              <TextInput label="Adresse (العربية)" dir="rtl" value={values["contact.address.ar"] ?? ""}
                onChange={(e) => set("contact.address.ar", e.target.value)} />
            </div>
          </Panel>

          <Panel className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
              <Share2 className="h-4 w-4 text-primary" /> Réseaux sociaux
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Facebook</FieldLabel>
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 flex-shrink-0 text-white/40" />
                  <TextInput className="flex-1" value={values["social.facebook"] ?? ""}
                    onChange={(e) => set("social.facebook", e.target.value)} placeholder="https://facebook.com/…" />
                </div>
              </div>
              <div>
                <FieldLabel>Instagram</FieldLabel>
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 flex-shrink-0 text-white/40" />
                  <TextInput className="flex-1" value={values["social.instagram"] ?? ""}
                    onChange={(e) => set("social.instagram", e.target.value)} placeholder="https://instagram.com/…" />
                </div>
              </div>
              <div>
                <FieldLabel>TikTok</FieldLabel>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 flex-shrink-0 text-white/40" />
                  <TextInput className="flex-1" value={values["social.tiktok"] ?? ""}
                    onChange={(e) => set("social.tiktok", e.target.value)} placeholder="https://tiktok.com/@…" />
                </div>
              </div>
              <div>
                <FieldLabel>WhatsApp (lien)</FieldLabel>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 flex-shrink-0 text-white/40" />
                  <TextInput className="flex-1" value={values["social.whatsapp"] ?? ""}
                    onChange={(e) => set("social.whatsapp", e.target.value)} placeholder="https://wa.me/…" />
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="p-4 sm:p-5">
            <div className="mb-1 flex items-center gap-2 text-sm font-bold text-white">
              <MessageCircle className="h-4 w-4 text-primary" /> WhatsApp — Réception des commandes
            </div>
            <p className="mb-4 text-xs text-white/40">
              Renseignez les numéros et choisissez lequel reçoit les commandes.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TextInput label="Numéro gérant" value={waNumbers.gerant}
                onChange={(e) => setWaNumbers((p) => ({ ...p, gerant: e.target.value }))} placeholder="0…" />
              <TextInput label="Numéro vendeur" value={waNumbers.vendeur}
                onChange={(e) => setWaNumbers((p) => ({ ...p, vendeur: e.target.value }))} placeholder="0…" />
              <TextInput label="Numéro livreur" value={waNumbers.livreur}
                onChange={(e) => setWaNumbers((p) => ({ ...p, livreur: e.target.value }))} placeholder="0…" />
            </div>
            <div className="mt-4 sm:w-64">
              <Select label="Numéro actif (reçoit les commandes)"
                value={values["whatsappActiveRole"] ?? "gerant"}
                onChange={(e) => set("whatsappActiveRole", e.target.value)}>
                <option value="gerant">Gérant</option>
                <option value="vendeur">Vendeur</option>
                <option value="livreur">Livreur</option>
              </Select>
            </div>
          </Panel>

          <Panel className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
              <FileText className="h-4 w-4 text-primary" /> Pied de page
            </div>
            <div className="grid grid-cols-1 gap-4">
              <TextArea label="À propos (Français)" value={values["footer.about.fr"] ?? ""}
                onChange={(e) => set("footer.about.fr", e.target.value)} />
              <TextArea label="À propos (English)" value={values["footer.about.en"] ?? ""}
                onChange={(e) => set("footer.about.en", e.target.value)} />
              <TextArea label="À propos (العربية)" dir="rtl" value={values["footer.about.ar"] ?? ""}
                onChange={(e) => set("footer.about.ar", e.target.value)} />
              <TextInput label="Copyright" value={values["footer.copyright"] ?? ""}
                onChange={(e) => set("footer.copyright", e.target.value)}
                placeholder="© 2026 Universal.sa — Tous droits réservés" />
            </div>
          </Panel>

          <div className="flex justify-end">
            <PrimaryButton onClick={save} loading={saving}>
              <Save className="h-4 w-4" /> Enregistrer
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

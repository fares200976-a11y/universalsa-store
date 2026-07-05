import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Truck, MapPin, User, Phone, Home, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeliveryWilayas } from "@/lib/useDeliveryPrices";
import { useOrderWhatsapp } from "@/lib/useSiteSettings";
import { useLang } from "@/contexts/LanguageContext";
import { trackViewContent, trackInitiateCheckout, trackPurchase } from "@/lib/pixel";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | number;
  productName: string;
  productPrice: number;
  brandName: string;
  type: string;
}

export function OrderModal({ isOpen, onClose, productId, productName, productPrice, brandName, type }: OrderModalProps) {
  const { t } = useLang();
  const m = t.modal;

  const DELIVERY_MODES = [
    { id: "domicile", label: m.modeHome, icon: "🏠" },
    { id: "bureau",   label: m.modePost, icon: "📦" },
  ];

  const [form, setForm] = useState({ nom: "", prenom: "", telephone: "", adresse: "", wilaya: "", mode: "domicile" });
  const [submitted,  setSubmitted]  = useState(false);
  const [sending,    setSending]    = useState(false);

  const ownerWhatsapp = useOrderWhatsapp();
  const wilayas = useDeliveryWilayas();
  const selectedWilaya = wilayas.find(w => w.name === form.wilaya);
  const deliveryCost   = selectedWilaya ? (form.mode === "domicile" ? selectedWilaya.domicile : selectedWilaya.bureau) : null;
  const total          = deliveryCost !== null ? productPrice + deliveryCost : null;

  useEffect(() => {
    if (isOpen) trackViewContent(productId, productPrice);
  }, [isOpen, productId, productPrice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const buildOrderText = () =>
    `🛒 *Nouvelle commande — Universal.sa*\n\n` +
    `*Produit :* Tapis ${type.toUpperCase()} ${brandName} ${productName}\n` +
    `*Prix tapis :* ${productPrice.toLocaleString("fr-DZ")} DA\n` +
    `*Wilaya :* ${form.wilaya}\n` +
    `*Livraison :* ${deliveryCost?.toLocaleString("fr-DZ")} DA\n` +
    `*Total :* ${total?.toLocaleString("fr-DZ")} DA\n\n` +
    `👤 *Client :* ${form.prenom} ${form.nom}\n` +
    `📞 *Téléphone :* ${form.telephone}\n` +
    `🏠 *Adresse :* ${form.adresse}, ${form.wilaya}\n` +
    `🚚 *Mode :* ${form.mode === "domicile" ? m.modeHome : m.modePost}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryCost === null || total === null) return;
    setSending(true);
    trackInitiateCheckout(productId, total);

    const orderText = buildOrderText();

    let orderSaved = false;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom, prenom: form.prenom, telephone: form.telephone,
          adresse: form.adresse, wilaya: form.wilaya,
          modeLivraison: form.mode === "domicile" ? "Livraison à domicile" : "Bureau de poste",
          brand: brandName, modelName: productName, type,
          prixTapis: productPrice, prixLivraison: deliveryCost, total,
        }),
      });
      orderSaved = res.ok;
    } catch { /* WhatsApp still works */ }

    window.open(`https://wa.me/${ownerWhatsapp}?text=${encodeURIComponent(orderText)}`, "_blank");
    setSending(false);
    setSubmitted(true);
    if (orderSaved) trackPurchase(productId, total);
  };

  const handleClose = () => {
    setSubmitted(false);
    setForm({ nom: "", prenom: "", telephone: "", adresse: "", wilaya: "", mode: "domicile" });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            className="relative w-full max-w-lg bg-[#111118] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <button onClick={handleClose} className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors" data-testid="btn-close-modal">
              <X className="w-4 h-4 text-white" />
            </button>

            {submitted ? (
              <div className="p-10 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }}>
                  <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">{m.successTitle}</h2>
                <p className="text-white/60 mb-1">{m.successThanks} <strong className="text-white">{form.prenom} {form.nom}</strong> {m.successFor}</p>
                <p className="text-white/60 mb-2">{m.successContact} <strong className="text-white">{form.telephone}</strong>.</p>
                <div className="flex items-center justify-center gap-2 text-sm text-green-400 mb-6">
                  <span>✅</span><span>{m.waNote}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left mb-6">
                  <div className="flex justify-between text-sm mb-2"><span className="text-white/60">Produit</span><span className="font-semibold">{brandName} {productName} ({type.toUpperCase()})</span></div>
                  <div className="flex justify-between text-sm mb-2"><span className="text-white/60">{m.wilaya}</span><span className="font-semibold">{form.wilaya}</span></div>
                  <div className="flex justify-between text-sm mb-2"><span className="text-white/60">{m.deliveryCost}</span><span className="font-semibold">{deliveryCost?.toLocaleString("fr-DZ")} DA</span></div>
                  <div className="border-t border-white/10 mt-3 pt-3 flex justify-between font-bold">
                    <span>{m.total}</span>
                    <span className="text-primary text-lg">{total?.toLocaleString("fr-DZ")} DA</span>
                  </div>
                </div>
                <Button onClick={handleClose} className="bg-primary hover:bg-primary/90 rounded-xl px-8">{m.close}</Button>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-primary/20 to-transparent px-8 py-6 border-b border-white/10">
                  <h2 className="text-xl font-bold">{m.title}</h2>
                  <p className="text-white/60 text-sm mt-1">
                    {brandName} {productName} — Tapis {type.toUpperCase()} — <span className="text-white font-semibold">{productPrice.toLocaleString("fr-DZ")} DA</span>
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <User className="w-3 h-3" /> {m.lastName}
                      </label>
                      <input name="nom" value={form.nom} onChange={handleChange} required placeholder={m.lastNamePh}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                        data-testid="input-nom" />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <User className="w-3 h-3" /> {m.firstName}
                      </label>
                      <input name="prenom" value={form.prenom} onChange={handleChange} required placeholder={m.firstNamePh}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                        data-testid="input-prenom" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> {m.phone}
                    </label>
                    <input name="telephone" value={form.telephone} onChange={handleChange} required type="tel" placeholder={m.phonePh}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                      data-testid="input-telephone" />
                  </div>

                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Home className="w-3 h-3" /> {m.address}
                    </label>
                    <input name="adresse" value={form.adresse} onChange={handleChange} required placeholder={m.addressPh}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                      data-testid="input-adresse" />
                  </div>

                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> {m.wilaya}
                    </label>
                    <select name="wilaya" value={form.wilaya} onChange={handleChange} required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                      data-testid="select-wilaya"
                    >
                      <option value="" className="bg-[#111118]">{m.wilayaPh}</option>
                      {wilayas.map(w => (
                        <option key={w.code} value={w.name} className="bg-[#111118]">
                          {w.code.toString().padStart(2, "0")} — {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Truck className="w-3 h-3" /> {m.delivery}
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {DELIVERY_MODES.map(mode => (
                        <label key={mode.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.mode === mode.id ? "border-primary/50 bg-primary/10" : "border-white/10 bg-white/5 hover:bg-white/8"}`}>
                          <input type="radio" name="mode" value={mode.id} checked={form.mode === mode.id} onChange={handleChange} className="accent-primary" data-testid={`radio-mode-${mode.id}`} />
                          <span className="text-lg">{mode.icon}</span>
                          <span className="text-sm font-medium">{mode.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {selectedWilaya && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="flex justify-between text-sm mb-2 text-white/60">
                        <span>{m.matPrice}</span>
                        <span className="text-white font-semibold">{productPrice.toLocaleString("fr-DZ")} DA</span>
                      </div>
                      <div className="flex justify-between text-sm mb-3 text-white/60">
                        <span>{m.deliveryCost} — {selectedWilaya.name}</span>
                        <span className="text-white font-semibold">{deliveryCost?.toLocaleString("fr-DZ")} DA</span>
                      </div>
                      <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-lg">
                        <span>{m.total}</span>
                        <span className="text-primary">{total?.toLocaleString("fr-DZ")} DA</span>
                      </div>
                    </motion.div>
                  )}

                  <Button type="submit" disabled={sending} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-3 h-auto text-base font-bold disabled:opacity-60" data-testid="btn-submit-order">
                    {sending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> {m.sending}
                      </span>
                    ) : m.confirm}
                  </Button>

                  <p className="text-center text-xs text-white/30">{m.note}</p>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

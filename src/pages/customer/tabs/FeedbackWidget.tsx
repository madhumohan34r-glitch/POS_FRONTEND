import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';


import { useFeedbackOrders, useOrderFeedbackItems, useSubmitFeedback } from '@/tanstack/alltanstack';

export default function FeedbackWidget({ tableNumber }: { tableNumber: number }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  // Backend order_id (Orders.order_id string), not a local numeric id.
  const [feedbackOrderId, setFeedbackOrderId] = useState('');
  // Backend submit_feedback only takes item_name — there's no item_id field
  // on the schema, so we track just the name selected from the dropdown.
  const [feedbackItemName, setFeedbackItemName] = useState('');

  // Orders this customer can leave feedback on (fetched only while the
  // modal is open).
  const { data: feedbackOrdersData } = useFeedbackOrders(showFeedback);
  const feedbackOrders: { order_id: string; total_amount: number }[] = feedbackOrdersData?.orders ?? [];

  // Item names for the currently selected order (fetched only once an
  // order is picked).
  const { data: orderItemsData } = useOrderFeedbackItems(feedbackOrderId || null);
  const orderItemNames: string[] = orderItemsData?.items ?? [];

  const submitFeedbackMutation = useSubmitFeedback();

  const handleSubmit = () => {
    submitFeedbackMutation.mutate(
      {
        order_id: feedbackOrderId || undefined,
        item_name: feedbackItemName || undefined,
        rating: feedbackRating,
        feedback_text: feedbackMessage || undefined,
      },
      {
        onSuccess: (res: any) => {
          // Backend answers 200 + { success:false, message } when the plan
          // doesn't include feedback — show that instead of a fake success.
          if (res?.success === false) {
            toast.error(res.message || 'Feedback is not available');
            return;
          }
          toast.success('Thanks for your feedback!');
          setFeedbackRating(0);
          setFeedbackMessage('');
          setFeedbackOrderId('');
          setFeedbackItemName('');
          setShowFeedback(false);
        },
      }
    );
  };

  return (
    <>
      <button onClick={() => { setFeedbackOrderId(''); setFeedbackItemName(''); setShowFeedback(true); }}
        className="fixed bottom-10 left-4 h-12 px-4 rounded-full bg-gradient-to-r from-accent to-accent/80 text-accent-foreground flex items-center gap-2 z-30 cafe-shadow-lg hover:scale-105 transition-transform text-sm font-medium">
        ⭐ Feedback
      </button>

      <AnimatePresence>
        {showFeedback && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50" onClick={() => setShowFeedback(false)} />
            
            {/* Centered modal. Wrapper centers it with flex; height is capped to the
                viewport so nothing is cut off — long content scrolls inside the card. */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="pointer-events-auto w-full max-w-sm bg-background rounded-2xl border border-border p-5 cafe-shadow-lg max-h-[calc(100dvh-2rem)] overflow-y-auto">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-lg">Your Feedback</h3>
                <button onClick={() => setShowFeedback(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
              </div>
              
              <div className="space-y-4">
                {/* Select order for feedback */}
                {feedbackOrders.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Feedback for (optional)</p>
                    <select
                      value={feedbackOrderId}
                      onChange={e => { setFeedbackOrderId(e.target.value); setFeedbackItemName(''); }}
                      className="w-full h-9 rounded-xl border border-border bg-background text-sm px-3"
                    >
                      <option value="">General feedback</option>
                      {feedbackOrders.map(o => (
                        <option key={o.order_id} value={o.order_id}>
                          {o.order_id} — ₹{o.total_amount.toFixed(0)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {feedbackOrderId && orderItemNames.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Rate specific item (optional)</p>
                    <select
                      value={feedbackItemName}
                      onChange={e => setFeedbackItemName(e.target.value)}
                      className="w-full h-9 rounded-xl border border-border bg-background text-sm px-3"
                    >
                      <option value="">Entire order</option>
                      {orderItemNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">How was your experience?</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setFeedbackRating(star)} className={`text-3xl transition-transform hover:scale-110 ${star <= feedbackRating ? 'text-accent' : 'text-muted-foreground/30'}`}>
                        ★
                      </button>
                    ))}
                  </div>
                  {feedbackRating > 0 && (
                    <Badge className={`mt-2 text-sm ${feedbackRating <= 1 ? 'bg-destructive/10 text-destructive' : feedbackRating <= 2 ? 'bg-accent/10 text-accent' : feedbackRating <= 3 ? 'bg-info/10 text-info' : feedbackRating <= 4 ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                      {feedbackRating <= 1 ? '😞 Bad' : feedbackRating <= 2 ? '😐 Average' : feedbackRating <= 3 ? '🙂 Good' : feedbackRating <= 4 ? '😊 Very Good' : '🤩 Excellent'}
                    </Badge>
                  )}
                </div>
                
                <Input placeholder="Share your thoughts (optional)..." value={feedbackMessage} onChange={e => setFeedbackMessage(e.target.value)} className="rounded-xl" />
                
                <Button
                  disabled={feedbackRating === 0 || submitFeedbackMutation.isPending}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl"
                  onClick={handleSubmit}
                >
                  {submitFeedbackMutation.isPending ? 'Submitting…' : 'Submit Feedback'}
                </Button>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
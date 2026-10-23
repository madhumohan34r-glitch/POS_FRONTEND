
import { useState, useMemo } from 'react';
import { MessageSquare, Search, Star, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFeedbackDashboard } from '@/tanstack/alltanstack';

export default function FeedbackTab() {
  const { data, isLoading } = useFeedbackDashboard();
  
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState('all');

  // Map backend "data" to your component's needs
  const feedbackList = data?.data || [];
  const stats = data?.["customer feedback"] || { total_submissions: 0, total_reviews: 0, avg_rating: 0, "5-star_reviews": 0, low_ratings: 0 };

  const filteredFeedbacks = useMemo(() => {
    let result = [...feedbackList];
    if (feedbackRatingFilter !== 'all') result = result.filter(f => f.rating === Number(feedbackRatingFilter));
    if (feedbackSearch) result = result.filter(f => f.comment.toLowerCase().includes(feedbackSearch.toLowerCase()));
    // Sort by created_at descending
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [feedbackList, feedbackRatingFilter, feedbackSearch]);

  if (isLoading) return <div className="py-20 flex justify-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Customer Feedback
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{stats.total_submissions} total submissions</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search feedback..." value={feedbackSearch} onChange={e => setFeedbackSearch(e.target.value)}
              className="pl-8 h-8 w-[180px] rounded-xl text-xs" />
          </div>
          <Select value={feedbackRatingFilter} onValueChange={setFeedbackRatingFilter}>
            <SelectTrigger className="h-8 w-[130px] rounded-xl text-xs"><SelectValue placeholder="Filter rating" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">⭐⭐⭐⭐⭐ (5)</SelectItem>
              <SelectItem value="4">⭐⭐⭐⭐ (4)</SelectItem>
              <SelectItem value="3">⭐⭐⭐ (3)</SelectItem>
              <SelectItem value="2">⭐⭐ (2)</SelectItem>
              <SelectItem value="1">⭐ (1)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Reviews', value: stats.total_submissions, icon: MessageSquare, color: 'from-primary/20 to-primary/5', iconColor: 'text-primary' },
          { label: 'Avg Rating', value: stats.avg_rating, icon: Star, color: 'from-accent/20 to-accent/5', iconColor: 'text-accent' },
          { label: '5-Star Reviews', value: stats['5-star_reviews'], icon: Star, color: 'from-success/20 to-success/5', iconColor: 'text-success' },
          { label: 'Low Ratings (≤2)', value: stats.low_ratings, icon: Star, color: 'from-destructive/20 to-destructive/5', iconColor: 'text-destructive' },
        ].map(stat => (
          <div key={stat.label} className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} border border-border cafe-shadow`}>
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              <span className="text-[11px] text-muted-foreground font-medium">{stat.label}</span>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Feedback Table */}
      <div className="rounded-2xl bg-card border border-border cafe-shadow overflow-hidden">
        {filteredFeedbacks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>No feedback found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Rating', 'Comment', 'Table', 'Date'].map(h => (
                    <th key={h} className="p-3 sm:p-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFeedbacks.map(f => (
                  <tr key={f.feedback_id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < f.rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">{f.rating_label}</span>
                    </td>
                    <td className="p-3 sm:p-4 text-sm text-foreground max-w-[300px]">{f.comment}</td>
                    <td className="p-3 sm:p-4"><Badge variant="outline" className="text-xs">Table {f.table_number}</Badge></td>
                    <td className="p-3 sm:p-4 text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
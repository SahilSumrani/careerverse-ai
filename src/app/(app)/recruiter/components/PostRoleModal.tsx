import type { FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export type PostRoleFormState = {
  title: string;
  company: string;
  location: string;
  type: string;
  workMode: string;
  salary: string;
  tags: string;
  blurb: string;
};

interface PostRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: PostRoleFormState;
  setForm: React.Dispatch<React.SetStateAction<PostRoleFormState>>;
  onPublish: (e: FormEvent) => Promise<void>;
  busy: boolean;
}

export function PostRoleModal({
  isOpen,
  onClose,
  form,
  setForm,
  onPublish,
  busy,
}: PostRoleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Publish a New Vacancy</h3>
            <p className="text-xs text-slate-500">Directly syncs to CareerVerse Opportunity Board.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={(e) => void onPublish(e)}>
          <div>
            <Label htmlFor="title" className="text-xs font-bold text-slate-700">
              Role Title *
            </Label>
            <Input
              id="title"
              required
              placeholder="e.g. Senior Frontend Engineer"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="company" className="text-xs font-bold text-slate-700">
              Hiring Company *
            </Label>
            <Input
              id="company"
              required
              placeholder="e.g. Acme Technologies"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="mt-1 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="location" className="text-xs font-bold text-slate-700">
                Location *
              </Label>
              <Input
                id="location"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="salary" className="text-xs font-bold text-slate-700">
                Salary Range
              </Label>
              <Input
                id="salary"
                placeholder="e.g. ₹18 LPA - ₹25 LPA"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                className="mt-1 rounded-xl"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tags" className="text-xs font-bold text-slate-700">
              Required Skills (comma-separated)
            </Label>
            <Input
              id="tags"
              placeholder="React, TypeScript, GraphQL, Node.js"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="mt-1 rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="blurb" className="text-xs font-bold text-slate-700">
              Role Description & Expectations *
            </Label>
            <textarea
              id="blurb"
              required
              minLength={20}
              placeholder="Describe the candidate responsibilities, qualifications, and company culture..."
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-200/20 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={form.blurb}
              onChange={(e) => setForm({ ...form, blurb: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700"
            >
              {busy ? "Publishing…" : "Publish Listing"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

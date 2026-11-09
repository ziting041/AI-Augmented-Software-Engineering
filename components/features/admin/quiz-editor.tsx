"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { getRepositories, toUserMessage } from "@/lib/data"
import { useRepositoryData } from "@/lib/data/hooks"
import * as edit from "@/lib/quiz/editor"
import type { Question, QuestionType, QuizDraft } from "@/lib/quiz/types"
import { LIMITS, validateQuiz } from "@/lib/quiz/validation"
import { EmptyState, ErrorState, LoadingState } from "../status-message"

/** quizId 省略時為新增模式 */
export function QuizEditor({ quizId }: { quizId?: string }) {
  if (!quizId) return <QuizForm initial={edit.createEmptyQuiz()} />
  return <ExistingQuizEditor quizId={quizId} />
}

function ExistingQuizEditor({ quizId }: { quizId: string }) {
  const state = useRepositoryData(`admin-quiz:${quizId}`, (repos) =>
    repos.quizzes.get(quizId),
  )
  if (state.status === "loading") return <LoadingState />
  if (state.status === "error")
    return <ErrorState message={state.message} onRetry={state.reload} />
  if (!state.data) return <EmptyState title="找不到這份測驗" />
  return <QuizForm key={quizId} quizId={quizId} initial={edit.toDraft(state.data)} />
}

function QuizForm({ quizId, initial }: { quizId?: string; initial: QuizDraft }) {
  const router = useRouter()
  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const problems = validateQuiz(draft)
    setErrors(problems)
    if (problems.length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    setSaving(true)
    try {
      const repos = await getRepositories()
      if (quizId) await repos.quizzes.update(quizId, draft)
      else await repos.quizzes.create(draft)
      router.push("/admin")
    } catch (err) {
      setErrors([toUserMessage(err, "儲存失敗，請稍後再試")])
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-3xl font-black">{quizId ? "編輯測驗" : "新增測驗"}</h1>
        <div className="flex gap-2">
          <Link href="/admin" className={buttonVariants({ variant: "ghost" })}>
            取消
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? "儲存中…" : "儲存測驗"}
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <p className="mb-2 font-medium">請修正以下問題：</p>
          <ul className="list-disc space-y-1 pl-5">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>基本資訊</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="quiz-title">測驗標題</Label>
            <Input
              id="quiz-title"
              value={draft.title}
              maxLength={LIMITS.titleMax}
              placeholder="例如：你是哪一種森林動物？"
              onChange={(e) => setDraft(edit.updateQuizFields(draft, { title: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quiz-description">測驗說明</Label>
            <Textarea
              id="quiz-description"
              value={draft.description}
              maxLength={LIMITS.descriptionMax}
              placeholder="會顯示在測驗開始前"
              onChange={(e) =>
                setDraft(edit.updateQuizFields(draft, { description: e.target.value }))
              }
            />
          </div>
          <Label className="cursor-pointer">
            <Checkbox
              checked={draft.published}
              onCheckedChange={(published) =>
                setDraft(edit.updateQuizFields(draft, { published }))
              }
            />
            發布（勾選後所有使用者都看得到）
          </Label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>結果類型</CardTitle>
          <CardDescription>
            作答完畢後，總分最高的結果類型就是使用者的測驗結果；同分時以排列較前者為準。
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={draft.results.length >= LIMITS.maxResults}
              onClick={() => setDraft(edit.addResult(draft))}
            >
              <Plus data-icon="inline-start" aria-hidden />
              新增結果
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4">
          {draft.results.map((result, i) => (
            <fieldset key={result.id} className="grid gap-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <legend className="text-sm font-medium">結果 {i + 1}</legend>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`刪除結果 ${i + 1}`}
                  disabled={draft.results.length <= LIMITS.minResults}
                  onClick={() => setDraft(edit.removeResult(draft, result.id))}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
              <Input
                aria-label={`結果 ${i + 1} 名稱`}
                placeholder="名稱，例如：貓頭鷹：冷靜的思考者"
                value={result.title}
                onChange={(e) =>
                  setDraft(edit.updateResult(draft, result.id, { title: e.target.value }))
                }
              />
              <Textarea
                aria-label={`結果 ${i + 1} 說明`}
                placeholder="結果說明"
                value={result.description}
                onChange={(e) =>
                  setDraft(edit.updateResult(draft, result.id, { description: e.target.value }))
                }
              />
            </fieldset>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <h2 className="text-lg font-semibold">題目</h2>
        {draft.questions.map((question, i) => (
          <QuestionEditor
            key={question.id}
            index={i}
            total={draft.questions.length}
            question={question}
            draft={draft}
            onChange={setDraft}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={draft.questions.length >= LIMITS.maxQuestions}
          onClick={() => setDraft(edit.addQuestion(draft))}
        >
          <Plus data-icon="inline-start" aria-hidden />
          新增題目
        </Button>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "儲存中…" : "儲存測驗"}
        </Button>
      </div>
    </form>
  )
}

function QuestionEditor({
  index,
  total,
  question,
  draft,
  onChange,
}: {
  index: number
  total: number
  question: Question
  draft: QuizDraft
  onChange: (draft: QuizDraft) => void
}) {
  const label = `第 ${index + 1} 題`

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardAction className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${label}上移`}
            disabled={index === 0}
            onClick={() => onChange(edit.moveQuestion(draft, question.id, -1))}
          >
            <ArrowUp aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${label}下移`}
            disabled={index === total - 1}
            onClick={() => onChange(edit.moveQuestion(draft, question.id, 1))}
          >
            <ArrowDown aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`刪除${label}`}
            disabled={total <= LIMITS.minQuestions}
            onClick={() => onChange(edit.removeQuestion(draft, question.id))}
          >
            <Trash2 aria-hidden />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Textarea
          aria-label={`${label}題目內容`}
          placeholder="題目內容"
          value={question.text}
          onChange={(e) => onChange(edit.updateQuestion(draft, question.id, { text: e.target.value }))}
        />

        <RadioGroup
          aria-label={`${label}題型`}
          className="flex gap-4"
          value={question.type}
          onValueChange={(type) =>
            onChange(edit.updateQuestion(draft, question.id, { type: type as QuestionType }))
          }
        >
          <Label className="cursor-pointer">
            <RadioGroupItem value="single" />
            單選題
          </Label>
          <Label className="cursor-pointer">
            <RadioGroupItem value="multiple" />
            多選題
          </Label>
        </RadioGroup>

        <div className="grid gap-3">
          {question.options.map((option, oi) => {
            const optionLabel = `${label}選項 ${oi + 1}`
            return (
              <div key={option.id} className="grid gap-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={`${optionLabel}內容`}
                    placeholder={`選項 ${oi + 1}`}
                    value={option.text}
                    onChange={(e) =>
                      onChange(edit.updateOptionText(draft, question.id, option.id, e.target.value))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`刪除${optionLabel}`}
                    disabled={question.options.length <= LIMITS.minOptions}
                    onClick={() => onChange(edit.removeOption(draft, question.id, option.id))}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span className="self-center">加分：</span>
                  {draft.results.map((result, ri) => (
                    <label key={result.id} className="flex items-center gap-1">
                      <span className="max-w-32 truncate">
                        {result.title || `結果 ${ri + 1}`}
                      </span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={LIMITS.scoreMin}
                        max={LIMITS.scoreMax}
                        step={1}
                        className="h-7 w-16"
                        aria-label={`${optionLabel}對結果 ${ri + 1} 的分數`}
                        value={option.scores[result.id] ?? 0}
                        onChange={(e) =>
                          onChange(
                            edit.setOptionScore(
                              draft,
                              question.id,
                              option.id,
                              result.id,
                              e.target.valueAsNumber,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-self-start"
            disabled={question.options.length >= LIMITS.maxOptions}
            onClick={() => onChange(edit.addOption(draft, question.id))}
          >
            <Plus data-icon="inline-start" aria-hidden />
            新增選項
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

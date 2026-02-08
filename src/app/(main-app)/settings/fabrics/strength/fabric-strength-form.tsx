"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { FabricStrength } from "./columns"

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Fabric strength name is required.")
    .min(2, "Fabric strength name must be at least 2 characters.")
    .max(50, "Fabric strength name must be at most 50 characters.")
    .transform((s) => {
      const trimmed = s.trim()
      if (!trimmed) return trimmed
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
    }),
})

interface FabricStrengthFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string }) => void | Promise<void>
  initialData?: FabricStrength | null
  isSubmitting?: boolean
}

export function FabricStrengthForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isSubmitting = false,
}: FabricStrengthFormProps) {
  const form = useForm({
    defaultValues: {
      name: initialData?.name || "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const parsed = formSchema.parse(value)
        await onSubmit(parsed)
        form.reset()
        onOpenChange(false)
      } catch {
        // Leave dialog open on error; parent shows toast
      }
    },
  })

  React.useEffect(() => {
    if (open && initialData) {
      form.setFieldValue("name", initialData.name)
    } else if (open && !initialData) {
      form.reset()
    }
  }, [open, initialData, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Fabric Strength" : "Add Fabric Strength"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the fabric strength information below."
              : "Add a new fabric strength to the system."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            {/* eslint-disable react/no-children-prop */}
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Fabric Strength Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="e.g., Strong, Medium, Light"
                      autoComplete="off"
                    />
                    <FieldDescription>
                      Enter the name of the fabric strength.
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
            {/* eslint-enable react/no-children-prop */}
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset()
                onOpenChange(false)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

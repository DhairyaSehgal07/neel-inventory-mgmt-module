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
import { FabricWidth } from "./columns"

const formSchema = z.object({
  value: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "string" ? parseFloat(v) : v))
    .pipe(z.number().positive("Value must be a positive number")),
})

interface FabricWidthFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { value: number }) => void | Promise<void>
  initialData?: FabricWidth | null
  isSubmitting?: boolean
}

export function FabricWidthForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isSubmitting = false,
}: FabricWidthFormProps) {
  const form = useForm({
    defaultValues: {
      value: initialData?.value ?? "",
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
    if (open && initialData != null) {
      form.setFieldValue("value", initialData.value)
    } else if (open && !initialData) {
      form.reset()
    }
  }, [open, initialData, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Fabric Width" : "Add Fabric Width"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the fabric width value below."
              : "Add a new fabric width to the system."}
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
              name="value"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                const displayValue =
                  field.state.value === "" ? "" : String(field.state.value)
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Width (value)</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="any"
                      min={0}
                      value={displayValue}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        const v = e.target.value
                        field.handleChange(v === "" ? "" : parseFloat(v) || v)
                      }}
                      aria-invalid={isInvalid}
                      placeholder="e.g., 1.5, 2, 3"
                      autoComplete="off"
                    />
                    <FieldDescription>
                      Enter the width value (positive number).
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

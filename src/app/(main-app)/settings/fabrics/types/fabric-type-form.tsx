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
import { FabricType } from "./columns"

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Fabric type name is required.")
    .min(2, "Fabric type name must be at least 2 characters.")
    .max(50, "Fabric type name must be at most 50 characters."),
})

interface FabricTypeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string }) => void
  initialData?: FabricType | null
}

export function FabricTypeForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: FabricTypeFormProps) {
  const form = useForm({
    defaultValues: {
      name: initialData?.name || "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
      form.reset()
      onOpenChange(false)
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
            {initialData ? "Edit Fabric Type" : "Add Fabric Type"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the fabric type information below."
              : "Add a new fabric type to the system."}
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
                    <FieldLabel htmlFor={field.name}>Fabric Type Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="e.g., Cotton, Polyester, Silk"
                      autoComplete="off"
                    />
                    <FieldDescription>
                      Enter the name of the fabric type.
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
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

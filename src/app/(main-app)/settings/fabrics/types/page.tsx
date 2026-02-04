"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTable } from "./data-table"
import { columns, FabricType } from "./columns"
import { FabricTypeForm } from "./fabric-type-form"

// Mock data - simulating a database
const initialData: FabricType[] = [
  { id: "1", name: "Cotton" },
  { id: "2", name: "Polyester" },
  { id: "3", name: "Silk" },
  { id: "4", name: "Wool" },
  { id: "5", name: "Linen" },
]

export default function FabricTypesPage() {
  const [data, setData] = React.useState<FabricType[]>(initialData)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingFabricType, setEditingFabricType] =
    React.useState<FabricType | null>(null)

  const handleAdd = () => {
    setEditingFabricType(null)
    setIsFormOpen(true)
  }

  const handleEdit = (fabricType: FabricType) => {
    setEditingFabricType(fabricType)
    setIsFormOpen(true)
  }

  const handleDelete = (fabricType: FabricType) => {
    if (confirm(`Are you sure you want to delete "${fabricType.name}"?`)) {
      setData((prev) => prev.filter((item) => item.id !== fabricType.id))
    }
  }

  const handleSubmit = (formData: { name: string }) => {
    if (editingFabricType) {
      // Update existing fabric type
      setData((prev) =>
        prev.map((item) =>
          item.id === editingFabricType.id
            ? { ...item, name: formData.name }
            : item
        )
      )
    } else {
      // Add new fabric type
      const newFabricType: FabricType = {
        id: Date.now().toString(),
        name: formData.name,
      }
      setData((prev) => [...prev, newFabricType])
    }
    setEditingFabricType(null)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fabric Types</CardTitle>
              <CardDescription>
                Manage fabric types in your inventory system.
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Fabric Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <FabricTypeForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        initialData={editingFabricType}
      />
    </div>
  )
}

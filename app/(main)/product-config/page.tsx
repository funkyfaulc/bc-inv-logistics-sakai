"use client";

import { useEffect, useState, useRef } from "react";
import { collection, getDocs, updateDoc, addDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/app/firebase";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Chip } from "primereact/chip";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { ProductType } from "@/types/products";

export default function ProductConfigPage() {
    const [productTypes, setProductTypes] = useState<ProductType[]>([]);
    const [selectedConfig, setSelectedConfig] = useState<ProductType | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<string>("");
    const [newColor, setNewColor] = useState<string>("");
    const [newSize, setNewSize] = useState<string>("");
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        fetchProductTypes();
    }, []);

    const fetchProductTypes = async () => {
        const querySnapshot = await getDocs(collection(db, "product_types"));
        const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductType));
        setProductTypes(products);
    };

    const saveConfig = async () => {
        if (!selectedConfig?.id) {
            console.error("Error: selectedConfig.id is undefined");
            return;
        }

        await updateDoc(doc(db, "product_types", selectedConfig.id), JSON.parse(JSON.stringify(selectedConfig)));

        // Close the modal after save
        setIsDialogVisible(false);

        // Refresh product types after saving
        fetchProductTypes();

        // Show success message
        toast.current?.show({ severity: "success", summary: "Saved", detail: "Product Type updated successfully", life: 3000 });
    };

    const addNewProductType = async () => {
        const newProduct: ProductType = {
            product: "",
            validColors: [],
            validSizes: [],
            materials: {}
        };
        setSelectedConfig(newProduct);
        setIsDialogVisible(true);
    };

    const deleteProductType = async () => {
        if (!selectedConfig?.id) return;

        await deleteDoc(doc(db, "product_types", selectedConfig.id));

        setIsDeleteDialogVisible(false);
        fetchProductTypes();

        toast.current?.show({ severity: "warn", summary: "Deleted", detail: "Product Type deleted", life: 3000 });
    };

    return (
        <div>
            <Toast ref={toast} />

            <h2>Product Configuration</h2>
            <Button label="Add New Product Type" onClick={addNewProductType} className="p-button-primary mb-3" />
            <table>
                <thead>
                    <tr>
                        <th>Product Type</th>
                        <th>Valid Colors</th>
                        <th>Valid Sizes</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {productTypes.map((product) => (
                        <tr key={product.id}>
                            <td>{product.product}</td>
                            <td>
                                {product.materials
                                    ? Object.entries(product.materials).map(([material, data]) => (
                                        <div key={material}><strong>{material}:</strong> {data.validColors?.join(", ") || "None"}</div>
                                    ))
                                    : product.validColors?.join(", ")}
                            </td>
                            <td>
                                {product.materials
                                    ? Object.entries(product.materials).map(([material, data]) => (
                                        <div key={material}><strong>{material}:</strong> {data.validSizes?.join(", ") || "None"}</div>
                                    ))
                                    : product.validSizes?.join(", ")}
                            </td>
                            <td>
                                <Button icon="pi pi-pencil" className="p-button-sm mr-2" onClick={() => { setSelectedConfig(product); setIsDialogVisible(true); }} />
                                <Button icon="pi pi-trash" className="p-button-sm p-button-danger" onClick={() => { setSelectedConfig(product); setIsDeleteDialogVisible(true); }} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 🛠 Edit Dialog */}
            <Dialog header="Edit Product Type" visible={isDialogVisible} onHide={() => setIsDialogVisible(false)}>
                {selectedConfig && (
                    <div>
                        <h3>{selectedConfig.product || "New Product"}</h3>
                        <InputText value={selectedConfig.product} onChange={(e) => setSelectedConfig({ ...selectedConfig, product: e.target.value })} placeholder="Product Type" />

                        {/* Materials Dropdown for Pillowcases */}
                        {selectedConfig.materials && Object.keys(selectedConfig.materials).length > 0 && (
                            <>
                                <h4>Material</h4>
                                <Dropdown
                                    value={selectedMaterial}
                                    options={Object.keys(selectedConfig.materials)}
                                    onChange={(e) => setSelectedMaterial(e.value)}
                                    placeholder="Select Material"
                                />
                            </>
                        )}

                        <h4>Valid Colors</h4>
                        <div>
                            {selectedConfig.validColors?.map((color, index) => (
                                <Chip key={index} label={color} removable onRemove={() => {
                                    const updatedColors = [...(selectedConfig.validColors || [])];
                                    updatedColors.splice(index, 1);
                                    setSelectedConfig({ ...selectedConfig, validColors: updatedColors });
                                }} />
                            ))}
                            <InputText value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="Enter new color" />
                            <Button label="Add" onClick={() => {
                                setSelectedConfig(prev => ({
                                    ...prev!,
                                    validColors: [...(prev!.validColors || []), newColor],
                                }));
                                setNewColor("");
                            }} />
                        </div>

                        <h4>Valid Sizes</h4>
                        <div>
                            {selectedConfig.validSizes?.map((size, index) => (
                                <Chip key={index} label={size} removable onRemove={() => {
                                    const updatedSizes = [...(selectedConfig.validSizes || [])];
                                    updatedSizes.splice(index, 1);
                                    setSelectedConfig({ ...selectedConfig, validSizes: updatedSizes });
                                }} />
                            ))}
                            <InputText value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder="Enter new size" />
                            <Button label="Add" onClick={() => {
                                setSelectedConfig(prev => ({
                                    ...prev!,
                                    validSizes: [...(prev!.validSizes || []), newSize],
                                }));
                                setNewSize("");
                            }} />
                        </div>

                        <Button label="Save" className="mt-3" onClick={saveConfig} />
                    </div>
                )}
            </Dialog>

            {/* ❌ Delete Confirmation */}
            <Dialog header="Confirm Deletion" visible={isDeleteDialogVisible} onHide={() => setIsDeleteDialogVisible(false)}>
                <p>Are you sure you want to delete this product type?</p>
                <Button label="Yes" className="p-button-danger" onClick={deleteProductType} />
            </Dialog>
        </div>
    );
}

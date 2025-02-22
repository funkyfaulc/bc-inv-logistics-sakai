"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/app/firebase";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Chip } from "primereact/chip";
import { ProductType } from "@/types/products";

export default function ProductConfigPage() {
    const [productTypes, setProductTypes] = useState<ProductType[]>([]);
    const [selectedConfig, setSelectedConfig] = useState<ProductType | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<string>("");
    const [isDialogVisible, setIsDialogVisible] = useState(false);

    useEffect(() => {
        const fetchProductTypes = async () => {
            const querySnapshot = await getDocs(collection(db, "product_types"));
            const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductType));
            setProductTypes(products);
        };
        fetchProductTypes();
    }, []);

    const saveConfig = async () => {
        if (!selectedConfig?.id) {
            console.error("Error: selectedConfig.id is undefined");
            return;
        }

        await updateDoc(doc(db, "product_types", selectedConfig.id), JSON.parse(JSON.stringify(selectedConfig)));
    };

    return (
        <div>
            <h2>Product Configuration</h2>
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
                                {product.product === "Pillowcase"
                                    ? product.materials && Object.entries(product.materials).map(([material, data]) => (
                                        <div key={material}><strong>{material}:</strong> {data.validColors?.join(", ") || "None"}</div>
                                    ))
                                    : product.validColors?.join(", ")}
                            </td>
                            <td>
                                {product.product === "Pillowcase"
                                    ? product.materials && Object.entries(product.materials).map(([material, data]) => (
                                        <div key={material}><strong>{material}:</strong> {data.validSizes?.join(", ") || "None"}</div>
                                    ))
                                    : product.validSizes?.join(", ")}
                            </td>
                            <td>
                                <Button icon="pi pi-pencil" onClick={() => {
                                    setSelectedConfig(product);
                                    setSelectedMaterial("");
                                    setIsDialogVisible(true);
                                }} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Dialog header="Edit Product Type" visible={isDialogVisible} onHide={() => setIsDialogVisible(false)}>
                {selectedConfig && (
                    <div>
                        <h3>{selectedConfig.product}</h3>

                        {selectedConfig.product === "Pillowcase" ? (
                            <>
                                {/* 🔥 Pillowcase Specific UI */}
                                <Dropdown
                                    value={selectedMaterial}
                                    options={selectedConfig.materials ? Object.keys(selectedConfig.materials) : []}
                                    onChange={(e) => setSelectedMaterial(e.value)}
                                    placeholder="Select Material"
                                />

                                {selectedMaterial && selectedConfig.materials?.[selectedMaterial] ? (
                                    <>
                                        <h4>Valid Colors</h4>
                                            <div>
                                                {(selectedConfig.materials?.[selectedMaterial]?.validColors || []).map((color, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={color}
                                                        removable
                                                        onRemove={() => {
                                                            setSelectedConfig(prevConfig => {
                                                                if (!prevConfig) return prevConfig;

                                                                return {
                                                                    ...prevConfig,
                                                                    materials: {
                                                                        ...prevConfig.materials,
                                                                        [selectedMaterial]: {
                                                                            ...prevConfig.materials?.[selectedMaterial],
                                                                            validColors: prevConfig.materials?.[selectedMaterial]?.validColors?.filter((_, i) => i !== index) || []
                                                                        }
                                                                    }
                                                                };
                                                            });
                                                        }}
                                                    />
                                                ))}
                                            </div>

                                            <h4>Valid Sizes</h4>
                                                <div>
                                                    {(selectedConfig.materials?.[selectedMaterial]?.validSizes || []).map((size, index) => (
                                                        <Chip
                                                            key={index}
                                                            label={size}
                                                            removable
                                                            onRemove={() => {
                                                                setSelectedConfig(prevConfig => {
                                                                    if (!prevConfig) return prevConfig;

                                                                    return {
                                                                        ...prevConfig,
                                                                        materials: {
                                                                            ...prevConfig.materials,
                                                                            [selectedMaterial]: {
                                                                                ...prevConfig.materials?.[selectedMaterial],
                                                                                validSizes: prevConfig.materials?.[selectedMaterial]?.validSizes?.filter((_, i) => i !== index) || []
                                                                            }
                                                                        }
                                                                    };
                                                                });
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                    </>
                                ) : (
                                    <p>Select a material to configure.</p>
                                )}
                            </>
                        ) : (
                            <>
                                {/* 🔥 Non-Pillowcase Products */}
                                <h4>Valid Colors</h4>
                                <div>
                                    {(selectedConfig.validColors || []).map((color, index) => (
                                        <Chip
                                            key={index}
                                            label={color}
                                            removable
                                            onRemove={() => {
                                                setSelectedConfig(prevConfig => prevConfig ? ({
                                                    ...prevConfig,
                                                    validColors: prevConfig.validColors?.filter((_, i) => i !== index) || []
                                                }) : prevConfig);
                                            }}
                                        />
                                    ))}
                                </div>

                                <h4>Valid Sizes</h4>
                                <div>
                                    {(selectedConfig.validSizes || []).map((size, index) => (
                                        <Chip
                                            key={index}
                                            label={size}
                                            removable
                                            onRemove={() => {
                                                setSelectedConfig(prevConfig => prevConfig ? ({
                                                    ...prevConfig,
                                                    validSizes: prevConfig.validSizes?.filter((_, i) => i !== index) || []
                                                }) : prevConfig);
                                            }}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        <Button label="Save" onClick={saveConfig} />
                    </div>
                )}
            </Dialog>
        </div>
    );
}

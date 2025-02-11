"use client";

import { useEffect, useState, useRef } from "react";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { getActiveOrders, getOrderProducts, saveInventoryProduction } from "@services/InventoryProductionService";
import { Order, OrderItem } from "@/types/orders";
import { MultiSelect } from "primereact/multiselect";
import ProductService from "@services/ProductService"; // ✅ Ensure correct path

const InventoryProduction = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orderProducts, setOrderProducts] = useState<OrderItem[]>([]);
    const [cartonCounts, setCartonCounts] = useState<Record<string, number>>({});
    const [spareUnits, setSpareUnits] = useState<Record<string, number>>({});
    const [searchTerm, setSearchTerm] = useState<string>(""); // ✅ Added state for search
    const [loading, setLoading] = useState<boolean>(false);
    const toast = useRef<Toast>(null);

    // ✅ Extract fetchProducts into a reusable function
    const fetchProducts = async (orderId: string) => {
        try {
            const products = await getOrderProducts(orderId);
            const allProducts = await ProductService.getProducts(); // ✅ Fetch all products

            const updatedProducts = products.map((product) => {
                const productDetails = allProducts.find(p => p.asin === product.asin);
                return {
                    ...product,
                    unitsPerCarton: productDetails?.unitsPerCarton ?? 1, // ✅ Assign correct value
                };
            });

            setOrderProducts(updatedProducts);
        } catch (error) {
            console.error("🔥 Error fetching products:", error);
        }
    };

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const activeOrders = await getActiveOrders();
                setOrders(activeOrders);
            } catch (error) {
                console.error("Error fetching orders:", error);
            }
        };
        fetchOrders();
    }, []);

    useEffect(() => {
        if (selectedOrder) {
            fetchProducts(selectedOrder.orderId);
        } else {
            setOrderProducts([]);
        }
    }, [selectedOrder]);

    // ✅ Handle carton input change
    const handleCartonChange = (asin: string, value: number | null) => {
        setCartonCounts((prev) => ({ ...prev, [asin]: value ?? 0 }));
    };

    // ✅ Handle spare unit input change
    const handleSpareChange = (asin: string, value: number | null) => {
        setSpareUnits((prev) => ({ ...prev, [asin]: value ?? 0 }));
    };

    // ✅ Calculate total units
    const calculateTotalUnits = (product: OrderItem) => {
        const unitsPerCarton = product.unitsPerCarton ?? 1; // ✅ Use fetched unitsPerCarton
        return (cartonCounts[product.asin] ?? 0) * unitsPerCarton + (spareUnits[product.asin] ?? 0);
    };

    // ✅ Handle saving production data
   const handleSave = async () => {
        if (!selectedOrder) {
            toast.current?.show({ severity: "warn", summary: "No Order Selected", detail: "Please select an order first." });
            return;
        }

        const productionData = orderProducts.map((product) => ({
            asin: product.asin,
            sku: product.sku,
            totalUnitCount: calculateTotalUnits(product),
            totalCartonCount: cartonCounts[product.asin] ?? 0,
            unitsPerCarton: product.unitsPerCarton ?? 1, // ✅ Include when saving
            orderId: selectedOrder.orderId,
        }));

        console.log("🔥 Saving Production Data:", productionData);

        try {
            await saveInventoryProduction(
                productionData.map((item) => ({
                    ...item,
                    orderId: selectedOrder.orderId, // ✅ Ensure orderId is passed
                }))
            );
            toast.current?.show({ severity: "success", summary: "Saved", detail: "Production data saved successfully." });

            // ✅ Delay re-fetching to ensure Firestore has updated
            setTimeout(() => {
                if (selectedOrder) {
                    fetchProducts(selectedOrder.orderId);
                }
                }, 700);
            } catch (error) {
                console.error("🔥 Error saving production data:", error);
                toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to save production data." });
            }
    };

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <h2 className="text-xl font-semibold mb-3">Order Production Details</h2>

            {/* Dropdown for Selecting Orders */}
            <div className="mb-3">
                <label className="font-medium mb-3 block">Select Active Order</label>
                <Dropdown
                    value={selectedOrder}
                    options={orders}
                    onChange={(e) => {
                        setSelectedOrder(e.value),
                        setOrderProducts([]); // ✅ Clear products when order changes
                    }}
                    optionLabel="orderId"
                    placeholder="Select an Order"
                    className="w-full md:w-20rem"
                />
            </div>

            {/* 🔍 Search Bar for SKUs */}
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search SKU..."
                className="p-inputtext p-component w-full md:w-20rem mb-3"
            />

            {/* Data Table Section */}
            {selectedOrder && (
                <>
                    <div className="flex justify-end mb-3">
                        <Button label="Save Production Data" className="p-button-sm" onClick={handleSave} />
                    </div>

                    <DataTable
                        value={orderProducts
                            .filter((p) => p.sku.toLowerCase().includes(searchTerm.toLowerCase()))} // ✅ Search filter applied
                        paginator
                        rows={10}
                        filterDisplay="menu"
                    >
                        <Column field="sku" header="SKU" />

                        {/* Carton and Spare Units */}
                        <Column header="Cartons Ordered"
                            body={(rowData) => (
                                <InputNumber
                                    value={cartonCounts[rowData.asin] ?? 0} // ✅ Store by ASIN
                                    onValueChange={(e) => handleCartonChange(rowData.asin, e?.value ?? 0)}
                                    min={0}
                                />
                            )}
                        />
                        <Column header="Spare Units"
                            body={(rowData) => (
                                <InputNumber
                                    value={spareUnits[rowData.asin] ?? 0}
                                    onValueChange={(e) => handleSpareChange(rowData.asin, e?.value ?? 0)}
                                    min={0}
                                />
                            )}
                        />
                        <Column header="Total Units"
                            body={(rowData) => calculateTotalUnits(rowData)}                        />
                    </DataTable>

                    {loading && <p className="text-center">Loading products...</p>}
                    {!loading && orderProducts.length === 0 && <p className="text-center">No products found for this order.</p>}

                    <Button label="Save Production Data" className="mt-3" onClick={handleSave} />
                </>
            )}
        </div>
    );
};

export default InventoryProduction;

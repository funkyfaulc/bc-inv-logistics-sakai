//bc-inventory-logistics-app/bc-inv-logistics-sakai/app/(main)/inventory-production/page.tsx


"use client";

import { useEffect, useState, useRef } from "react";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { getActiveOrders, getOrderProducts, saveInventoryProduction, fetchInventoryProduction} from "@services/InventoryProductionService";
import { Order, OrderItem, OrderItemFirestore } from "@/types/orders";
import { MultiSelect } from "primereact/multiselect";
import ProductService from "@services/ProductService"; // ✅ Ensure correct path
import { Card } from "primereact/card";

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
            console.log(`🔄 Fetching production data for Order ID: ${selectedOrder.orderId}`);

            setOrderProducts([]); // Reset state before fetching
            setCartonCounts({});
            setSpareUnits({});

            fetchInventoryProduction(selectedOrder.orderId)
                .then((data: OrderItem[]) => {
                    console.log("✅ Data returned from Firestore:", data);
                    setOrderProducts(data);

                    // Initialize cartonCounts and spareUnits from Firestore data
                    const newCartonCounts: Record<string, number> = {};
                    const newSpareUnits: Record<string, number> = {};

                    data.forEach((item) => {
                        newCartonCounts[item.asin] = item.totalCartonCount || 0;
                        // Calculate spare units by subtracting carton units from total
                        const cartonUnits = (item.totalCartonCount || 0) * (item.unitsPerCarton || 1);
                        newSpareUnits[item.asin] = (item.totalUnitCount || 0) - cartonUnits;
                    });

                    setCartonCounts(newCartonCounts);
                    setSpareUnits(newSpareUnits);
                })
                .catch((error: unknown) => {
                    console.error("🔥 Error loading production data:", error);
                });
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
    const calculateTotalUnitsPerProduct = (product: OrderItem) => {
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
            totalUnitCount: calculateTotalUnitsPerProduct(product),
            totalCartonCount: cartonCounts[product.asin] ?? 0,
            unitsPerCarton: product.unitsPerCarton ?? 1,
            orderId: selectedOrder.orderId,
        }));

        console.log("🔥 Saving Production Data:", productionData);

        try {
            await saveInventoryProduction(productionData);
            console.log("✅ Production data saved! Now forcing a refresh...");

            // ✅ Immediately fetch the latest data after saving
            const refreshedData = await fetchInventoryProduction(selectedOrder.orderId);
            console.log("✅ Fetched After Save:", refreshedData);
            setOrderProducts(refreshedData);

            toast.current?.show({ severity: "success", summary: "Saved", detail: "Production data saved successfully." });

        } catch (error) {
            console.error("🔥 Error saving production data:", error);
            toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to save production data." });
        }
    };

    const calculateTotalUnits = () => {
        return orderProducts.reduce((sum, item) => sum + (cartonCounts[item.asin] ?? 0) * (item.unitsPerCarton || 1) + (spareUnits[item.asin] ?? 0), 0);
    };

    // Placeholder for COGS (replace with actual logic later)
    const calculateTotalCOGS = () => {
        return 0; // Placeholder, will update when COGS data is available
    }


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

            {/*Scorecard UI */}
            <Card className="p-4 mb-4 shadow-2 border-round">
                <div className="flex justify-content-between align-items-center">
                    <div>
                        <h2 className="text-lg font-bold">Order Summary</h2>
                        <p className="text-sm text-secondary">Updated in real-time</p>
                    </div>
                    <div className="flex gap-4">
                        <div>
                            <p className="text-xl font-semibold">{calculateTotalUnits()}</p>
                            <p className="text-sm text-secondary">Total Units</p>
                        </div>
                        <div>
                            <p className="text-xl font-semibold">${calculateTotalCOGS()}</p>
                            <p className="text-sm text-secondary">Total COGS</p>
                        </div>
                    </div>
                </div>
            </Card>


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
                            body={(rowData) => calculateTotalUnitsPerProduct(rowData)}                        />
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

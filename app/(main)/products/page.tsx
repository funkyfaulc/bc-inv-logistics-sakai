/* eslint-disable @next/next/no-img-element */
//bc-inventory-logistics-app/bc-inv-logistics-sakai/app/(main)/products/page.tsx
'use client';

import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState, Suspense, lazy } from 'react';
import ProductService from '../../../demo/services/ProductService';
import Papa from 'papaparse';
import { Product as ProductType } from '@/types/products';
import { Order } from '@/types/orders';

interface Product extends ProductType {
    [key: string]: any;
}

//Lavy load the OrderEditModal component
const OrderEditModal = lazy(() => import('@/app/(main)/orders/modal/OrderEditModal'));


const Crud = () => {
    const emptyProduct = {
        id: '',
        product: '',
        material: '',
        color: '',
        size: '',
        asin: '',
        sku: '',
        upc: ''
    };

    const [products, setProducts] = useState<Product[]>([]);
    const [productDialog, setProductDialog] = useState(false);
    const [deleteProductDialog, setDeleteProductDialog] = useState(false);
    const [deleteProductsDialog, setDeleteProductsDialog] = useState(false);
    const [bulkUploadDialog, setBulkUploadDialog] = useState(false); // Add this for dialog state
    const [product, setProduct] = useState<Product>(emptyProduct);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
  

    const toast = useRef<Toast>(null);
    const dt = useRef(null);

    const handleHideModal = () => {
        setIsEditModalVisible(false);
    };

    const handleSaveOrder = async () => {
        setSubmitted(true);
        //Save Logic Here
        setIsEditModalVisible(false);
    };


    const productOptions = [
        { label: 'Bed Sheets', value: 'Bed Sheets' },
        { label: 'Pillowcase', value: 'Pillowcase' },
        { label: 'Flat Sheet', value: 'Flat Sheet' },
        { label: 'Fitted Sheet', value: 'Fitted Sheet' },
        { label: 'Duvet Cover', value: 'Duvet Cover' },
        { label: 'Crib Sheet', value: 'Crib Sheet' }
    ];

    const materialOptions = [
        { label: 'Bamboo', value: 'Bamboo' },
        { label: 'Silk', value: 'Silk' }
    ];

    const colorOptionsByProduct: { [key: string]: { label: string; value: string }[] } = {
        'Bed Sheets': [
            { label: 'Black', value: 'Black' },
            { label: 'Coastal Blue', value: 'Coastal Blue' },
            { label: 'Charcoal Grey', value: 'Charcoal Grey' },
            { label: 'Champagne', value: 'Champagne' },
            { label: 'Dune', value: 'Dune' },
            { label: 'Grey Mist', value: 'Grey Mist' },
            { label: 'Ivory', value: 'Ivory' },
            { label: 'Lilac', value: 'Lilac' },
            { label: 'Marigold', value: 'Marigold' },
            { label: 'Merlot', value: 'Merlot' },
            { label: 'Mocha', value: 'Mocha' },
            { label: 'Olive', value: 'Olive' },
            { label: 'Raisin', value: 'Raisin' },
            { label: 'Slate Blue', value: 'Slate Blue' },
            { label: 'Sea Glass', value: 'Sea Glass' },
            { label: 'Twilight Blue', value: 'Twilight Blue' },
            { label: 'White', value: 'White' }
        ],
        Pillowcase: [
            { label: 'Black', value: 'Black' },
            { label: 'Coastal Blue', value: 'Coastal Blue' },
            { label: 'Charcoal Grey', value: 'Charcoal Grey' },
            { label: 'Champagne', value: 'Champagne' },
            { label: 'Dune', value: 'Dune' },
            { label: 'Grey Mist', value: 'Grey Mist' },
            { label: 'Ivory', value: 'Ivory' },
            { label: 'Lilac', value: 'Lilac' },
            { label: 'Marigold', value: 'Marigold' },
            { label: 'Merlot', value: 'Merlot' },
            { label: 'Mocha', value: 'Mocha' },
            { label: 'Olive', value: 'Olive' },
            { label: 'Raisin', value: 'Raisin' },
            { label: 'Slate Blue', value: 'Slate Blue' },
            { label: 'Sea Glass', value: 'Sea Glass' },
            { label: 'Twilight Blue', value: 'Twilight Blue' },
            { label: 'White', value: 'White' }
        ]
    };

    const sizeOptionsByProduct: { [key: string]: { label: string; value: string }[] } = {
        'Bed Sheets': [
            { label: 'Queen', value: 'Queen' },
            { label: 'King', value: 'King' },
            { label: 'Cal King', value: 'Cal King' },
            { label: 'Split King', value: 'Split King' },
            { label: 'Twin', value: 'Twin' },
            { label: 'TwinXL', value: 'TwinXL' },
            { label: 'Full', value: 'Full' },
            { label: 'Split Top King', value: 'Split Top King' }
        ],
        Pillowcase: [
            { label: 'Standard', value: 'Standard' },
            { label: 'Queen', value: 'Queen' },
            { label: 'King', value: 'King' }
        ]
    };

    const [colorOptions, setColorOptions] = useState<{ label: string; value: string }[]>([]);
    const [sizeOptions, setSizeOptions] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        ProductService.getProducts().then((data) => setProducts(data));
    }, []);

    const openNew = () => {
        setProduct(emptyProduct);
        setSubmitted(false);
        setProductDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setProductDialog(false);
    };

    const createNewProduct = () => {
        const newProduct: Product = {
            id: '', // Temporary ID; will be replaced after saving to Firestore
            product: ''
            // other fields...
        };

        setProduct(newProduct);
        setProductDialog(true);
    };

    const saveProduct = async () => {
        setSubmitted(true);

        if (product.product.trim()) {
            // Fetch all products from Firestore
            const existingProductsSnapshot = await ProductService.getProducts();
            const existingSKUs = new Set(existingProductsSnapshot.map((p) => p.sku));
            const existingASINs = new Set(existingProductsSnapshot.map((p) => p.asin));

            // Updated to prefer ASIN over SKU
            if (
                (product.asin && existingASINs.has(product.asin) && product.id !== existingProductsSnapshot.find((p) => p.asin === product.asin)?.id) ||
                (existingSKUs.has(product.sku) && product.id !== existingProductsSnapshot.find((p) => p.sku === product.sku)?.id)
            ) {
                if (toast.current) {
                    toast.current.show({
                        severity: 'warn',
                        summary: 'Duplicate Found',
                        detail: `Cannot Update, Duplicate Found (ASIN: ${product.asin} or SKU: ${product.sku})`,
                        life: 4000
                    });
                }
                return; // Prevent further execution if duplicate found
            }

            let _products = [...products];
            let _product = { ...product };

            if (product.id) {
                const index = findIndexById(product.id);
                _products[index] = _product;
                if (toast.current) {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Product Updated', life: 3000 });
                }

                // Firestore update product
                console.log('Updating product in Firestore: ', _product);
                await ProductService.updateProduct(product.id, _product);
            } else {
                _product.id = createId();
                _products.push(_product);
                if (toast.current) {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Product Created', life: 3000 });
                }

                // Firestore add product
                console.log('Adding product to Firestore: ', _product);
                await ProductService.addProduct(_product);
            }

            setProducts(_products);
            setProductDialog(false);
            setProduct(emptyProduct);
        }
    };

    const onProductChange = (e: { value: string }) => {
        const selectedProduct = e.value;
        let updatedProduct = { ...product, product: selectedProduct, color: '' };
        // Default to Bamboo for Bed Sheets
        if (selectedProduct === 'Bed Sheets') {
            updatedProduct.material = 'Bamboo';
        }

        setProduct(updatedProduct);
        setColorOptions(colorOptionsByProduct[selectedProduct] || []);
        setSizeOptions(sizeOptionsByProduct[selectedProduct] || []);
    };
    
        const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | DropdownChangeEvent, name: keyof Product) => {
        const val = (e as DropdownChangeEvent).value || (e.target as HTMLInputElement).value || '';
        let _product = { ...product };
        _product[name] = val as any;
        setProduct(_product);
    };

    const findIndexById = (id: string) => {
        let index = -1;
        for (let i = 0; i < products.length; i++) {
            if (products[i].id === id) {
                index = i;
                break;
            }
        }
        return index;
    };

    const createId = () => {
        let id = '';
        let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 5; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    };

    const confirmDeleteProduct = (product: Product) => {
        setProduct(product);
        setDeleteProductDialog(true);
    };

    //Single Delete
    const deleteProduct = async () => {
        try {
            // Remove the product from Firestore first
            await ProductService.deleteProduct(product.id);

            // Then remove it from the local state
            let _products = products.filter((val) => val.id !== product.id);
            setProducts(_products);
            setDeleteProductDialog(false);
            setProduct(emptyProduct);
            if (toast.current) {
                toast.current.show({ severity: 'success', summary: 'Successful', detail: '1 Product Deleted', life: 3000 });
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            if (toast.current) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete product', life: 3000 });
            }
        }
    };

    //Bulk Delete
    const deleteSelectedProducts = async () => {
        try {
            // Remove products from Firestore first
            for (const selectedProduct of selectedProducts) {
                await ProductService.deleteProduct(selectedProduct.id); // Ensure each selected product is deleted from Firestore
            }

            // Then remove the products from the local state
            let _products = products.filter((val) => !selectedProducts.includes(val));
            const deletedCount = selectedProducts.length; // Count how many products were deleted
            setProducts(_products);
            setDeleteProductsDialog(false);
            setSelectedProducts([]);
            if (toast.current) {
                toast.current.show({ severity: 'success', summary: 'Successful', detail: `${deletedCount} Products Deleted`, life: 3000 });
            }
        } catch (error) {
            console.error('Error deleting products:', error);
            if (toast.current) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete products', life: 3000 });
            }
        }
    };

    const editProduct = (product: Product) => {
        // Set the product, color ,and size dropdown options based on the product type
        setProduct({ ...product });
        setColorOptions(colorOptionsByProduct[product.product] || []);
        setSizeOptions(sizeOptionsByProduct[product.product] || []);
        setProductDialog(true);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) {
            return;
        }
        const file = files[0];
        Papa.parse(file, {
            header: true,
            complete: async (results) => {
                let data = results.data;

                // Convert the headers to lowercase
                data = data.map((product: any) => {
                    const normalizedProduct: { [key: string]: any } = {};
                    for (const key in product) {
                        normalizedProduct[key.toLowerCase()] = product[key]; // Convert keys to lowercase
                    }
                    return normalizedProduct;
                });

                console.log('Parsed and normalized CSV data:', data);
                await bulkUploadProducts(data as Product[]);
            },
            error: (err) => {
                console.error('Error parsing CSV:', err);
            }
        });
    };

    //Bulk Upload Products Functionality
    const bulkUploadProducts = async (products: Product[]) => {
        let totalAdded = 0; // Keep track of successfully added products
        let errors = []; // Keep track of errors (e.g., missing required fields, duplicates)

        try {
            const existingProductsSnapshot = await ProductService.getProducts(); // Fetch all products from Firestore
            const existingSKUs = new Set(existingProductsSnapshot.map((product) => product.sku)); // Collect existing SKUs
            const existingASINs = new Set(existingProductsSnapshot.map((product) => product.asin)); // Collect existing ASINs

            for (const product of products) {
                // Updated to prioritize ASIN for duplicate checking
                if (product.asin && existingASINs.has(product.asin)) {
                    errors.push(`Duplicate found (ASIN: ${product.asin})`);
                    continue; // Skip this product
                } else if (existingSKUs.has(product.sku)) {
                    errors.push(`Duplicate found (SKU: ${product.sku || 'N/A'})`);
                    continue; // Skip this product
                }

                // Validate required fields
                if (!product.product || !product.size) {
                    errors.push(`Missing required fields for SKU: ${product.sku || 'N/A'}`);
                    continue; // Skip this product
                }

                // Add product to Firestore
                console.log('Adding product:', product);
                await ProductService.addProduct(product);
                totalAdded++; // Increment successfully added products
            }

            if (toast.current) {
                toast.current.show({ severity: 'success', summary: 'Upload Successful', detail: `${totalAdded} products added`, life: 3000 });
            }

            // If there were errors, display them
            if (errors.length > 0) {
                if (toast.current) {
                    toast.current.show({ severity: 'warn', summary: 'Upload Warnings', detail: `Some products were skipped: ${errors.join(', ')}`, life: 5000 });
                }
            }

            // Refetch products to refresh the list and show total count
            const updatedProducts = await ProductService.getProducts();
            setProducts(updatedProducts); // Update the state with new product list
            console.log('Total products in the database:', updatedProducts.length);
        } catch (error) {
            console.error('Error in bulk upload:', error);
            if (toast.current) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to upload products', life: 3000 });
            }
        }
    };

    const openBulkUpload = () => setBulkUploadDialog(true); // Function for opening bulk upload dialog
    const hideBulkUploadDialog = () => setBulkUploadDialog(false); // Function for closing bulk upload dialog

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="New" icon="pi pi-plus" severity="success" className="mr-2" onClick={openNew} />
                <Button label="Delete" icon="pi pi-trash" severity="danger" onClick={() => setDeleteProductsDialog(true)} disabled={!selectedProducts || !selectedProducts.length} />
                <Button label="Bulk Upload" icon="pi pi-upload" severity="info" className="ml-2" onClick={openBulkUpload} />
            </React.Fragment>
        );
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Products</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.currentTarget.value)} placeholder="Search..." />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Product) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" className="p-button-rounded p-button-success mr-2" onClick={() => editProduct(rowData)} />
                <Button icon="pi pi-trash" className="p-button-rounded p-button-warning" onClick={() => confirmDeleteProduct(rowData)} />
            </React.Fragment>
        );
    };

    const productDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" text onClick={saveProduct} />
        </>
    );

    const deleteProductDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" text onClick={() => setDeleteProductDialog(false)} />
            <Button label="Yes" icon="pi pi-check" text onClick={deleteProduct} />
        </>
    );

    const deleteProductsDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" text onClick={() => setDeleteProductsDialog(false)} />
            <Button label="Yes" icon="pi pi-check" text onClick={deleteSelectedProducts} />
        </>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                    <DataTable
                        ref={dt}
                        value={products}
                        selection={selectedProducts}
                        onSelectionChange={(e) => setSelectedProducts(e.value)}
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
                        globalFilter={globalFilter}
                        emptyMessage="No products found."
                        header={header}
                        responsiveLayout="scroll"
                        selectionMode={'multiple'}
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                        <Column field="product" header="Product" sortable></Column>
                        <Column field="material" header="Material" sortable></Column>
                        <Column field="color" header="Color" sortable></Column>
                        <Column field="size" header="Size" sortable></Column>
                        <Column field="sku" header="SKU" sortable></Column>
                        <Column field="asin" header="ASIN" sortable></Column>
                        <Column field="upc" header="UPC" sortable></Column>
                        <Column body={actionBodyTemplate} headerStyle={{ width: '8rem' }}></Column>
                    </DataTable>

                    <Dialog visible={productDialog} style={{ width: '450px' }} header="Product Details" modal className="p-fluid" footer={productDialogFooter} onHide={hideDialog}>
                        <div className="field">
                            <label htmlFor="product">Product</label>
                            <Dropdown id="product" value={product.product} options={productOptions} onChange={onProductChange} placeholder="Select a Product" className={classNames({ 'p-invalid': submitted && !product.product })} />
                            {submitted && !product.product && <small className="p-invalid">Product is required.</small>}
                        </div>

                        {product.product === 'Pillowcase' && (
                            <div className="field">
                                <label htmlFor="material">Material</label>
                                <Dropdown
                                    id="material"
                                    value={product.material}
                                    options={materialOptions}
                                    onChange={(e) => onInputChange(e, 'material')}
                                    placeholder="Select a Material"
                                    className={classNames({ 'p-invalid': submitted && !product.material })}
                                />
                                {submitted && !product.material && <small className="p-invalid">Material is required.</small>}
                            </div>
                        )}

                        <div className="field">
                            <label htmlFor="color">Color</label>
                            <Dropdown id="color" value={product.color} options={colorOptions} onChange={(e) => onInputChange(e, 'color')} placeholder="Select a Color" className={classNames({ 'p-invalid': submitted && !product.color })} />
                            {submitted && !product.color && <small className="p-invalid">Color is required.</small>}
                        </div>

                        <div className="field">
                            <label htmlFor="size">Size</label>
                            <Dropdown id="size" value={product.size} options={sizeOptions} onChange={(e) => onInputChange(e, 'size')} placeholder="Select a Size" className={classNames({ 'p-invalid': submitted && !product.size })} />
                            {submitted && !product.size && <small className="p-invalid">Size is required.</small>}
                        </div>

                        <div className="field">
                            <label htmlFor="asin">ASIN</label>
                            <InputText id="asin" value={product.asin} onChange={(e) => onInputChange(e, 'asin')} />
                        </div>

                        <div className="field">
                            <label htmlFor="sku">SKU</label>
                            <InputText id="sku" value={product.sku} onChange={(e) => onInputChange(e, 'sku')} />
                        </div>

                        <div className="field">
                            <label htmlFor="upc">UPC</label>
                            <InputText id="upc" value={product.upc} onChange={(e) => onInputChange(e, 'upc')} />
                        </div>
                    </Dialog>

                    <Dialog visible={deleteProductDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteProductDialogFooter} onHide={() => setDeleteProductDialog(false)}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {product && (
                                <span>
                                    Are you sure you want to delete <b>{product.name}</b>?
                                </span>
                            )}
                        </div>
                    </Dialog>

                    <Dialog visible={deleteProductsDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteProductsDialogFooter} onHide={() => setDeleteProductsDialog(false)}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {product && <span>Are you sure you want to delete the selected products?</span>}
                        </div>
                    </Dialog>
                    <Dialog visible={bulkUploadDialog} style={{ width: '450px' }} header="Bulk Upload" modal className="p-fluid" onHide={hideBulkUploadDialog}>
                        <div className="field">
                            <label htmlFor="file">Upload CSV File</label>
                            <InputText type="file" accept=".csv" onChange={handleFileUpload} />
                        </div>
                    </Dialog>

                    <Suspense fallback={<div>Loading...</div>}>
                        <OrderEditModal
                            order={order}
                            setOrder={setOrder}
                            visible={isEditModalVisible}
                            onHide={handleHideModal}
                            onSave={handleSaveOrder}
                            submitted={submitted}
                            />
                    </Suspense>
                </div>
            </div>
        </div>
    );
};

const ProductsPage = () => (
    <Suspense fallback={<div>Loading...</div>}>
        <Crud />
    </Suspense>
);

export default ProductsPage;

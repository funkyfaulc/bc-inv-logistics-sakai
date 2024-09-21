/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import { ProductService } from '../../../../demo/service/ProductService';


const Crud = () => {
    const emptyProduct = {
        id: '',
        product: '',
        material: '',
        color: '',
        size: '',
        asin: '',
        sku: '',
        upc: '',
    };

    const [products, setProducts] = useState(null);
    const [productDialog, setProductDialog] = useState(false);
    const [deleteProductDialog, setDeleteProductDialog] = useState(false);
    const [deleteProductsDialog, setDeleteProductsDialog] = useState(false);
    const [product, setProduct] = useState(emptyProduct);
    const [selectedProducts, setSelectedProducts] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef(null);
    const dt = useRef(null);

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

    const colorOptionsByProduct = {
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
        'Pillowcase': [
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

    const sizeOptionsByProduct = {
        'Bed Sheets': [
            { label: 'Queen', value: 'Queen' },
            { label: 'King', value: 'King' },
            { label: 'Cal King', value: 'Cal King' },
            { label: 'Split King', value: 'Split King' },
            { label: 'Twin', value: 'Twin' },
            { label: 'TwinXL', value: 'TwinXL' },
            { label: 'Full', value: 'Full' },
            { label: 'Split Top King', value: 'Split Top King' },
        ],
        'Pillowcase': [
            { label: 'Standard', value: 'Standard' },
            { label: 'Queen', value: 'Queen' },
            { label: 'King', value: 'King' }
        ]
    };

    const [colorOptions, setColorOptions] = useState([]);
    const [sizeOptions, setSizeOptions] = useState([]);

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

    const saveProduct = async () => {
        setSubmitted(true);
    
        if (product.product.trim()) {
            let _products = [...products];
            let _product = { ...product };
            
            if (product.id) {
                const index = findIndexById(product.id);
                _products[index] = _product;
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Product Updated', life: 3000 });
                
                // Firestore update product
                console.log("Updating product in Firestore: ", _product); // Log for debugging
                await ProductService.updateProduct(product.id, _product);  // Use the ProductService.updateProduct method
            } else {
                _product.id = createId();
                _products.push(_product);
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Product Created', life: 3000 });
                
                // Firestore add product
                console.log("Adding product to Firestore: ", _product); // Log for debugging
                await ProductService.addProduct(_product);  // Use the ProductService.addProduct method
            }
    
            setProducts(_products);
            setProductDialog(false);
            setProduct(emptyProduct);
        }
    };
    

    const onProductChange = (e) => {
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

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _product = { ...product };
        _product[`${name}`] = val;
        setProduct(_product);
    };

    const findIndexById = (id) => {
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

    const confirmDeleteProduct = (product) => {
        setProduct(product);
        setDeleteProductDialog(true);
    };

    const deleteProduct = () => {
        let _products = products.filter((val) => val.id !== product.id);
        setProducts(_products);
        setDeleteProductDialog(false);
        setProduct(emptyProduct);
        toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Product Deleted', life: 3000 });
    };

    const deleteSelectedProducts = () => {
        let _products = products.filter((val) => !selectedProducts.includes(val));
        setProducts(_products);
        setDeleteProductsDialog(false);
        setSelectedProducts(null);
        toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Products Deleted', life: 3000 });
    };

    const editProduct = (product) => {
        setProduct({ ...product });
        setProductDialog(true);
    };

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="New" icon="pi pi-plus" severity="success" className="mr-2" onClick={openNew} />
                <Button label="Delete" icon="pi pi-trash" severity="danger" onClick={() => setDeleteProductsDialog(true)} disabled={!selectedProducts || !selectedProducts.length} />
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

    const actionBodyTemplate = (rowData) => {
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
                            <Dropdown
                                id="product"
                                value={product.product}
                                options={productOptions}
                                onChange={onProductChange}
                                placeholder="Select a Product"
                                className={classNames({ 'p-invalid': submitted && !product.product })}
                            />
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
                            <Dropdown
                                id="color"
                                value={product.color}
                                options={colorOptions}
                                onChange={(e) => onInputChange(e, 'color')}
                                placeholder="Select a Color"
                                className={classNames({ 'p-invalid': submitted && !product.color })}
                            />
                            {submitted && !product.color && <small className="p-invalid">Color is required.</small>}
                        </div>

                        <div className="field">
                            <label htmlFor="size">Size</label>
                            <Dropdown
                                id="size"
                                value={product.size}
                                options={sizeOptions}
                                onChange={(e) => onInputChange(e, 'size')}
                                placeholder="Select a Size"
                                className={classNames({ 'p-invalid': submitted && !product.size })}
                            />
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
                </div>
            </div>
        </div>
    );
};

export default Crud;

import { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import ProductService from '@/services/ProductService'; // Adjust path as per your project structure
import { Product } from '@/types/products';

const ProductCrud = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [colorOptions, setColorOptions] = useState<{ label: string; value: string }[]>([]);
    const [sizeOptions, setSizeOptions] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        ProductService.getProducts().then((data) => setProducts(data));
    }, []);

    const handleProductChange = async (productName: string) => {
        const productDetails = products.find((p) => p.product === productName);
        if (productDetails) {
            setSelectedProduct(productDetails);
            setColorOptions(
                productDetails.validColors.map((color) => ({ label: color, value: color }))
            );
            setSizeOptions(
                productDetails.validSizes.map((size) => ({ label: size, value: size }))
            );
        }
    };

    const addNewColor = async () => {
        const newColor = prompt('Enter a new color:');
        if (newColor && selectedProduct) {
            const updatedColors = [...colorOptions, { label: newColor, value: newColor }];
            setColorOptions(updatedColors);

            // Update Firestore
            await ProductService.updateProduct(selectedProduct.id, {
                validColors: updatedColors.map((color) => color.value),
            });
        }
    };

    const addNewSize = async () => {
        const newSize = prompt('Enter a new size:');
        if (newSize && selectedProduct) {
            const updatedSizes = [...sizeOptions, { label: newSize, value: newSize }];
            setSizeOptions(updatedSizes);

            // Update Firestore
            await ProductService.updateProduct(selectedProduct.id, {
                validSizes: updatedSizes.map((size) => size.value),
            });
        }
    };

    return (
        <div>
            <Dropdown
                value={selectedProduct?.product}
                options={products.map((p) => ({ label: p.product, value: p.product }))}
                onChange={(e) => handleProductChange(e.value)}
                placeholder="Select a Product"
                className="mb-3"
            />

            <Dropdown
                value={selectedProduct?.color}
                options={colorOptions}
                placeholder="Select a Color"
                className="mb-3"
            />
            <Button label="Add Color" onClick={addNewColor} className="mb-3" />

            <Dropdown
                value={selectedProduct?.size}
                options={sizeOptions}
                placeholder="Select a Size"
                className="mb-3"
            />
            <Button label="Add Size" onClick={addNewSize} className="mb-3" />
        </div>
    );
};

export default ProductCrud;

# SmartStore LK Test Data - Logical Reconciliation Breakdown

This document outlines the logical relationships and calculations behind the test data provided in `products.csv` and `suppliers.csv`. It serves as a verification guide to ensure all transaction, purchase, and payment logics operate correctly in your system.

---

## 1. Ceylon Agro Distributors
* **Company:** Agro Foods PLC
* **Phone:** 0112345678
* **Address:** 789 Negombo Rd, Ja-Ela

### Supplied Products
1. **Ceylon Keeri Samba Rice 5kg**
   * **Cost (Buying Price):** LKR 1,350.00
   * **Imported Stock (Quantity):** 100 pcs
   * **Subtotal Value:** LKR 135,000.00
2. **Munchee Super Cream Cracker 125g**
   * **Cost (Buying Price):** LKR 180.00
   * **Imported Stock (Quantity):** 200 pcs
   * **Subtotal Value:** LKR 36,000.00

### Financial Math
* **Total Stock Cost supplied:** LKR 171,000.00 (135,000 + 36,000)
* **Amount Already Settled:** LKR 120,000.00
* **Outstanding Balance (Remaining Payable):** **LKR 51,000.00**
* **Supplier CSV `payableAmount` value:** `51000`

---

## 2. Lanka Beverages Ltd
* **Company:** Lanka Beverages
* **Phone:** 0339876543
* **Address:** 12 Line St, Gampaha

### Supplied Products
1. **Elephant House Ginger Beer 400ml**
   * **Cost (Buying Price):** LKR 110.00
   * **Imported Stock (Quantity):** 150 pcs
   * **Subtotal Value:** LKR 16,500.00
2. **Coca-Cola 1.5L**
   * **Cost (Buying Price):** LKR 280.00
   * **Imported Stock (Quantity):** 120 pcs
   * **Subtotal Value:** LKR 33,600.00

### Financial Math
* **Total Stock Cost supplied:** LKR 50,100.00 (16,500 + 33,600)
* **Amount Already Settled:** LKR 35,000.00
* **Outstanding Balance (Remaining Payable):** **LKR 15,100.00**
* **Supplier CSV `payableAmount` value:** `15100`

---

## 3. Singhe Electronics & Plastics
* **Company:** Singhe Distributors
* **Phone:** 0777123456
* **Address:** 45 Main Street, Colombo 11

### Supplied Products
1. **LED Bulb 9W Pin**
   * **Cost (Buying Price):** LKR 320.00
   * **Imported Stock (Quantity):** 80 pcs
   * **Subtotal Value:** LKR 25,600.00
2. **Extension Cord 4-Way 5m**
   * **Cost (Buying Price):** LKR 1,250.00
   * **Imported Stock (Quantity):** 30 pcs
   * **Subtotal Value:** LKR 37,500.00

### Financial Math
* **Total Stock Cost supplied:** LKR 63,100.00 (25,600 + 37,500)
* **Amount Already Settled:** LKR 63,100.00
* **Outstanding Balance (Remaining Payable):** **LKR 0.00**
* **Supplier CSV `payableAmount` value:** `0`

---

## 4. Araliya Rice Mills
* **Company:** Araliya Group
* **Phone:** 0272223456
* **Address:** Polonnaruwa Rd, Kaduruwela

### Supplied Products
1. **Araliya Nadu Rice 5kg**
   * **Cost (Buying Price):** LKR 1,150.00
   * **Imported Stock (Quantity):** 200 pcs
   * **Subtotal Value:** LKR 230,000.00

### Financial Math
* **Total Stock Cost supplied:** LKR 230,000.00
* **Amount Already Settled:** LKR 105,000.00
* **Outstanding Balance (Remaining Payable):** **LKR 125,000.00**
* **Supplier CSV `payableAmount` value:** `125000`

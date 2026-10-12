import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Supplier } from '../../types';
import { useInventory } from '../../context/InventoryContext';

const supplierSchema = z.object({
  name: z.string().min(2, 'Supplier company name must be at least 2 characters'),
  contact_person: z.string().min(2, 'Contact person name is required'),
  phone: z.string().min(5, 'Phone number is required'),
  email: z.string().email('Please enter a valid email address'),
  address: z.string().min(3, 'Business address is required'),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  supplier,
}) => {
  const { addSupplier, updateSupplier } = useInventory();
  const isEditing = Boolean(supplier);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name,
        contact_person: supplier.contact_person,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        notes: supplier.notes || '',
      });
    } else {
      reset({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
      });
    }
  }, [supplier, isOpen, reset]);

  const onSubmit = async (data: SupplierFormData) => {
    if (isEditing && supplier) {
      const res = await updateSupplier(supplier.id, data);
      if (res.success) onClose();
    } else {
      const res = await addSupplier(data);
      if (res.success) onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Supplier' : 'Register New Hardware Supplier'}
      subtitle="Authorized distributor, manufacturer, or component vendor"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Supplier / Company Name"
          placeholder="e.g. Apex Silicon Distributors Inc."
          required
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Contact Person"
          placeholder="e.g. Marcus Vance"
          required
          error={errors.contact_person?.message}
          {...register('contact_person')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            required
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="orders@supplier.com"
            required
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <Input
          label="Business Address / Warehouse"
          placeholder="Street, City, State, Postal Code"
          required
          error={errors.address?.message}
          {...register('address')}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Supplier Notes & Terms</label>
          <textarea
            rows={3}
            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 custom-scrollbar shadow-sm dark:shadow-none"
            placeholder="Payment terms, RMA return policies, RMA contact window..."
            {...register('notes')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Register Supplier'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

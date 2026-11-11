import { Head, useForm } from '@inertiajs/react';
import SupplierLayout from '@/layouts/supplier/supplier-layout';
import FormSection from '@/components/supplier/form-section';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface BusinessForm {
    products_services: string;
    categories: string[];
    annual_revenue: string;
    number_of_employees: string;
    years_in_business: string;
    description: string;
}

export default function BusinessRegistration() {
    const { data, setData, post, processing, errors } = useForm<BusinessForm>({
        products_services: '',
        categories: [],
        annual_revenue: '',
        number_of_employees: '',
        years_in_business: '',
        description: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/supplier/registration/business');
    };

    return (
        <SupplierLayout currentStep={3}>
            <Head title="Business Information" />

            <form onSubmit={submit}>
                <FormSection
                    title="Business Information"
                    description="Tell us about the products and services you provide."
                    helpText="Select all categories that apply to your business. This helps us match you with relevant opportunities."
                    onBack="/supplier/registration/contact"
                    onSubmit={submit}
                    submitLabel="Continue"
                    isSubmitting={processing}
                    showSaveDraft={true}
                    lastSaved="Today at 9:42 AM"
                >
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">Products and Services</h3>
                            <p className="text-sm text-gray-600">Describe what your company offers.</p>
                        </div>

                        <div>
                            <Label htmlFor="products_services">Products / Services Description *</Label>
                            <Textarea
                                id="products_services"
                                value={data.products_services}
                                onChange={(e) => setData('products_services', e.target.value)}
                                placeholder="Describe the main products or services your company provides..."
                                rows={4}
                                className="mt-1.5"
                            />
                            {errors.products_services && <p className="mt-1 text-xs text-red-600">{errors.products_services}</p>}
                        </div>

                        <div>
                            <Label htmlFor="categories">Business Categories *</Label>
                            <Input
                                id="categories"
                                value={data.categories.join(', ')}
                                onChange={(e) => setData('categories', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                                placeholder="e.g. Construction Materials, IT & Technology"
                                className="mt-1.5"
                            />
                            <p className="mt-1.5 text-xs text-gray-500">Separate multiple categories with commas.</p>
                            {errors.categories && <p className="mt-1 text-xs text-red-600">{errors.categories}</p>}
                        </div>

                        <div className="pt-6">
                            <h3 className="text-base font-semibold text-gray-900">Business Overview</h3>
                            <p className="text-sm text-gray-600">Key facts about your business.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="years_in_business">Years in Business *</Label>
                                <Input id="years_in_business" type="number" value={data.years_in_business} onChange={(e) => setData('years_in_business', e.target.value)} className="mt-1.5" />
                                {errors.years_in_business && <p className="mt-1 text-xs text-red-600">{errors.years_in_business}</p>}
                            </div>

                            <div>
                                <Label htmlFor="number_of_employees">Number of Employees *</Label>
                                <Input id="number_of_employees" type="number" value={data.number_of_employees} onChange={(e) => setData('number_of_employees', e.target.value)} className="mt-1.5" />
                                {errors.number_of_employees && <p className="mt-1 text-xs text-red-600">{errors.number_of_employees}</p>}
                            </div>

                            <div>
                                <Label htmlFor="annual_revenue">Annual Revenue Range *</Label>
                                <Input id="annual_revenue" value={data.annual_revenue} onChange={(e) => setData('annual_revenue', e.target.value)} placeholder="e.g. $1M - $5M" className="mt-1.5" />
                                {errors.annual_revenue && <p className="mt-1 text-xs text-red-600">{errors.annual_revenue}</p>}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Additional Information</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Any additional details you would like to share..."
                                rows={4}
                                className="mt-1.5"
                            />
                            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                        </div>
                    </div>
                </FormSection>
            </form>
        </SupplierLayout>
    );
}

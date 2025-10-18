import React, { useState } from 'react';
import { PhoneIcon, EnvelopeIcon, LocationPinIcon } from './icons';

const ContactPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        service: '',
        message: '',
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically send the data to a server
        console.log('Form submitted:', formData);
        setIsSubmitted(true);
    };

    return (
        <div className="bg-light py-16 page-enter">
            <div className="container mx-auto px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-secondary">Get in Touch</h1>
                    <p className="text-slate-600 mt-4 max-w-2xl mx-auto text-lg">
                        We're here to help. Whether you have a question about a policy or want a free quote, please reach out.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-premium border border-slate-200/50">
                        {isSubmitted ? (
                            <div className="text-center py-20">
                                <h3 className="text-2xl font-bold text-emerald-600">Thank You!</h3>
                                <p className="text-slate-600 mt-2">Your message has been sent. An advisor will contact you shortly.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
                                    <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
                                    <div>
                                        <label htmlFor="service" className="block text-sm font-medium text-slate-700 mb-1.5">Service of Interest</label>
                                        <select id="service" name="service" value={formData.service} onChange={handleChange} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                                            <option value="">Select a service</option>
                                            <option>Life Insurance</option>
                                            <option>Health & Benefits</option>
                                            <option>Home & Property</option>
                                            <option>Auto & Commercial</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                                    <textarea id="message" name="message" rows={5} value={formData.message} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" required></textarea>
                                </div>
                                <button type="submit" className="w-full bg-primary-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-primary-700 transition-colors button-press">
                                    Send Message
                                </button>
                            </form>
                        )}
                    </div>
                    <div className="space-y-8">
                        <h3 className="text-2xl font-bold text-secondary">Contact Information</h3>
                        <div className="space-y-4 text-slate-700">
                             <div className="flex items-start">
                                <LocationPinIcon className="w-6 h-6 mr-3 text-primary-600 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold">Our Office</p>
                                    <p>Des Moines, IA</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <PhoneIcon className="w-6 h-6 mr-3 text-primary-600 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold">Phone</p>
                                    <a href="tel:717-847-9638" className="hover:text-primary-600">(717) 847-9638</a>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <EnvelopeIcon className="w-6 h-6 mr-3 text-primary-600 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold">Email</p>
                                    <a href="mailto:Info@newhollandfinancial.com" className="hover:text-primary-600">Info@newhollandfinancial.com</a>
                                </div>
                            </div>
                        </div>
                        <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-lg">
                           <iframe 
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d191305.2269963897!2d-93.77259445108643!3d41.57276997415484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87ee99a783e433af%3A0x4a4751493444e058!2sDes%20Moines%2C%20IA!5e0!3m2!1sen!2sus!4v1698182744158!5m2!1sen!2sus" 
                                width="100%" 
                                height="100%" 
                                style={{ border: 0 }} 
                                allowFullScreen={false} 
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade">
                            </iframe>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
      <label htmlFor={props.id || props.name} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input {...props} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
    </div>
);


export default ContactPage;

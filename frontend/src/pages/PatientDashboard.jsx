import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ClipboardPlus,
  FileHeart,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PatientAvatarMenu from '../components/PatientAvatarMenu';
import '../styles/PatientPortal.css';

const services = [
  {
    icon: CalendarDays,
    title: 'Appointments',
    description: 'Keep track of visits with your care team and stay ready for your next consultation.',
    accent: 'blue',
    tag: 'Care coordination',
    link: '/patient/appointments',
  },
  {
    icon: HeartPulse,
    title: 'Health records',
    description: 'Review health notes and vital readings shared with you after a consultation.',
    accent: 'green',
    tag: 'Your health history',
  },
  {
    icon: ClipboardPlus,
    title: 'Prescriptions',
    description: 'Find medication instructions and care guidance from your clinician in one place.',
    accent: 'purple',
    tag: 'Treatment guidance',
  },
  {
    icon: FileHeart,
    title: 'Personal health profile',
    description: 'Keep your contact information current so your care team can reach you when needed.',
    accent: 'orange',
    tag: 'Your account',
    link: '/patient/profile',
  },
];

const PatientDashboard = () => {
  const { user } = useAuth();
  const firstName = user?.first_name || user?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="patient-portal-page">
      <section className="patient-welcome-card">
        <div className="patient-welcome-card__topline">
          <PatientAvatarMenu size={60} align="left" />
          <span className="patient-role-pill"><ShieldCheck size={15} /> PATIENT PORTAL</span>
        </div>
        <div className="patient-welcome-card__content">
          <p className="patient-eyebrow">YOUR CARE, CONNECTED</p>
          <h1>Welcome back, {firstName}</h1>
          <p className="patient-welcome-card__intro">
            Your health information and care services, together in one calm and secure space.
          </p>
        </div>
        <div className="patient-welcome-card__decoration" aria-hidden="true">
          <div className="patient-welcome-card__orb patient-welcome-card__orb--one" />
          <div className="patient-welcome-card__orb patient-welcome-card__orb--two" />
          <div className="patient-welcome-card__pulse"><Activity size={36} /></div>
        </div>
        <div className="patient-welcome-card__footer">
          <span><span className="patient-live-dot" /> Your personal care space</span>
          <span>{user?.email}</span>
        </div>
      </section>

      <section className="patient-about-section" id="about">
        <div className="patient-section-heading">
          <div>
            <p className="patient-eyebrow">ABOUT MEDIFLOW</p>
            <h2>Care that feels easier to follow</h2>
          </div>
          <p className="patient-section-heading__summary">
            MediFlow helps bring your visits, health information, and treatment guidance together, so the next step in your care is easier to understand.
          </p>
        </div>

        <div className="patient-about-grid">
          <article className="patient-about-card patient-about-card--feature">
            <div className="patient-about-card__icon"><HeartPulse size={22} /></div>
            <h3>Your health, made personal</h3>
            <p>See information connected to your care and keep your profile details up to date.</p>
            <Link to="/patient/profile" className="patient-inline-link">Manage your profile <ArrowRight size={15} /></Link>
          </article>
          <article className="patient-about-card">
            <span className="patient-about-card__number">01</span>
            <h3>Stay informed</h3>
            <p>Find the health updates and care instructions your clinician shares with you.</p>
          </article>
          <article className="patient-about-card">
            <span className="patient-about-card__number">02</span>
            <h3>Feel prepared</h3>
            <p>Keep your contact details ready and know where to look before your next visit.</p>
          </article>
        </div>
      </section>

      <section className="patient-services-section" id="services">
        <div className="patient-section-heading patient-section-heading--services">
          <div>
            <p className="patient-eyebrow">MADE FOR YOUR CARE</p>
            <h2>Patient services</h2>
          </div>
          <p className="patient-section-heading__summary">
            Helpful tools for staying connected to your healthcare journey.
          </p>
        </div>

        <div className="patient-services-grid">
          {services.map(({ icon: Icon, title, description, accent, tag, link }) => {
            const content = (
              <>
                <div className={`patient-service-card__icon patient-service-card__icon--${accent}`}><Icon size={21} /></div>
                <span className="patient-service-card__tag">{tag}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                {link && <span className="patient-service-card__link">Open profile <ArrowRight size={15} /></span>}
              </>
            );

            return link ? (
              <Link to={link} className="patient-service-card patient-service-card--linked" key={title}>{content}</Link>
            ) : (
              <article className="patient-service-card" key={title}>{content}</article>
            );
          })}
        </div>
      </section>

      <section className="patient-care-note">
        <div className="patient-care-note__icon"><Stethoscope size={22} /></div>
        <div>
          <h2>Your care team is part of your journey</h2>
          <p>Clinical notes, readings, and prescriptions appear here when they are shared by your healthcare provider.</p>
        </div>
        <Link to="/patient/profile" aria-label="Open personal profile"><ArrowRight size={19} /></Link>
      </section>

      <footer className="patient-portal-footer">
        <span>MediFlow Patient Portal</span>
        <span>Here to help you stay connected to your care.</span>
      </footer>
    </div>
  );
};

export default PatientDashboard;

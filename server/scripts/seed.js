/**
 * Seeds MongoDB with a realistic demo dataset.
 *   npm run seed            -> wipes GigHub collections and re-seeds
 *
 * Demo logins (password: "password"):
 *   arjun@student.edu  (admin)   priya@student.edu   rahul@student.edu
 *   sneha@student.edu            dev@student.edu
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import Transaction from '../models/Transaction.js';
import { computeTrustScore } from '../services/trust.service.js';

const DAY = 86_400_000;
const HOUR = 3_600_000;
const now = Date.now();
const oid = () => new mongoose.Types.ObjectId();

async function run() {
  await connectDB();
  await Promise.all([User, Task, Review, Notification, Transaction].map((M) => M.deleteMany({})));
  await Promise.all([User, Task, Review, Notification, Transaction].map((M) => M.syncIndexes()));

  const password = await bcrypt.hash('password', 12);
  const ids = { arjun: oid(), priya: oid(), rahul: oid(), sneha: oid(), dev: oid() };

  const base = (o) => ({ password, links: [], penalties: 0, redMarks: 0, verifiedStudent: true, ...o });
  const users = [
    base({ _id: ids.arjun, role: 'admin', name: 'Arjun Sharma', email: 'arjun@student.edu', university: 'IIT Delhi', avatar: 'AS', avatarColor: '#ff6b35',
      bio: 'CS student passionate about web development and machine learning',
      skills: [{ name: 'Python', rating: 4.5 }, { name: 'Web Dev', rating: 4.0 }, { name: 'ML/AI', rating: 3.5 }],
      links: ['https://github.com/arjun'], rating: 4.6, ratingCount: 11, totalTasks: 12, completedTasks: 11, failedTasks: 1,
      totalEarned: 3200, walletBalance: 8000, createdAt: new Date(now - 90 * DAY) }),
    base({ _id: ids.priya, name: 'Priya Nair', email: 'priya@student.edu', university: 'NIT Trichy', avatar: 'PN', avatarColor: '#ec4899',
      bio: 'Design enthusiast | UI/UX designer | Poster artist',
      skills: [{ name: 'UI/UX', rating: 4.8 }, { name: 'Logo Design', rating: 4.5 }, { name: 'Illustration', rating: 4.0 }],
      links: ['https://behance.net/priya'], rating: 4.8, ratingCount: 18, totalTasks: 18, completedTasks: 18,
      totalEarned: 5100, walletBalance: 6000, createdAt: new Date(now - 120 * DAY) }),
    base({ _id: ids.rahul, name: 'Rahul Mishra', email: 'rahul@student.edu', university: 'VIT Vellore', avatar: 'RM', avatarColor: '#ff8c61',
      bio: 'Video editor & content creator. YouTube channel with 10K subs.',
      skills: [{ name: 'YouTube Videos', rating: 4.2 }, { name: 'Reels / Shorts', rating: 4.0 }, { name: 'Motion Graphics', rating: 3.8 }],
      links: ['https://youtube.com/@rahul'], rating: 4.1, ratingCount: 7, totalTasks: 8, completedTasks: 7, failedTasks: 1, penalties: 1,
      totalEarned: 1800, walletBalance: 4400, escrowLocked: 600, createdAt: new Date(now - 45 * DAY) }),
    base({ _id: ids.sneha, name: 'Sneha Reddy', email: 'sneha@student.edu', university: 'BITS Pilani', avatar: 'SR', avatarColor: '#10b981',
      bio: 'Tutor specializing in Maths and Physics. 3 years teaching experience.',
      skills: [{ name: 'Mathematics', rating: 4.9 }, { name: 'Physics', rating: 4.7 }, { name: 'Chemistry', rating: 4.3 }, { name: 'Science', rating: 4.5 }],
      rating: 4.9, ratingCount: 25, totalTasks: 25, completedTasks: 25, totalEarned: 7725, walletBalance: 5225, createdAt: new Date(now - 180 * DAY) }),
    base({ _id: ids.dev, name: 'Dev Kapoor', email: 'dev@student.edu', university: 'Delhi University', avatar: 'DK', avatarColor: '#f59e0b',
      bio: 'New to the platform. Eager to help with copywriting and content.', verifiedStudent: false,
      skills: [{ name: 'Articles', rating: 3.0 }, { name: 'Social Media', rating: 3.5 }],
      rating: 0, totalTasks: 0, completedTasks: 0, walletBalance: 4450, escrowLocked: 300, totalSpent: 250, createdAt: new Date(now - 5 * DAY) }),
  ].map((u) => ({ ...u, trustScore: computeTrustScore(u) }));

  await User.insertMany(users);

  const t = { t1: oid(), t2: oid(), t3: oid(), t4: oid(), t5: oid(), t6: oid(), t7: oid(), t8: oid(), t9: oid() };
  const task = (o) => ({ teamSize: 1, urgent: false, status: 'open', applicants: [], updates: [], experienceLevel: 'beginner', ...o });

  await Task.insertMany([
    task({ _id: t.t1, title: 'Build a Portfolio Website in React', category: 'coding', subfield: 'Web Dev', budget: 800, experienceLevel: 'intermediate', urgent: true,
      description: 'I need a clean, modern portfolio website built using React. Should include About, Projects, and Contact sections. Must be responsive and look professional.',
      deadline: new Date(now + 5 * DAY), creatorId: ids.priya, createdAt: new Date(now - DAY),
      applicants: [
        { userId: ids.arjun, commitment: 'full', bid: 750, message: 'I have built multiple React portfolios before. Check out my GitHub!', appliedAt: new Date(now - 2 * HOUR) },
        { userId: ids.rahul, commitment: 'partial', bid: 600, message: 'I can do the design and basic React structure.', appliedAt: new Date(now - HOUR) },
        { userId: ids.dev, commitment: 'uncertain', bid: 500, message: 'New here but a fast learner — happy to give it a shot!', appliedAt: new Date(now - HOUR / 2) },
      ] }),
    task({ _id: t.t2, title: 'Design a Logo for Student Startup', category: 'design', subfield: 'Logo Design', budget: 400,
      description: 'Our student startup needs a modern, minimalist logo. We are in the EdTech space. Colors: blue and white. Deliver PNG and SVG. Up to 3 revisions.',
      deadline: new Date(now + 3 * DAY), creatorId: ids.arjun, createdAt: new Date(now - 2 * DAY),
      applicants: [{ userId: ids.priya, commitment: 'full', bid: 350, message: 'Design is my passion! I will deliver something stunning.', appliedAt: new Date(now - 3 * HOUR) }] }),
    task({ _id: t.t3, title: 'Physics Tutor for JEE Preparation', category: 'tutoring', subfield: 'Physics', budget: 600, experienceLevel: 'expert', status: 'in_progress',
      description: 'Looking for an experienced physics tutor for JEE Advanced. Focus: Electrodynamics, Mechanics, Optics. 3 sessions of 2 hours each over 2 weeks.',
      deadline: new Date(now + 14 * DAY), creatorId: ids.rahul, selectedApplicantId: ids.sneha, escrowAmount: 600, createdAt: new Date(now - 3 * DAY),
      applicants: [{ userId: ids.sneha, commitment: 'full', bid: 600, message: 'I scored 99.8 percentile in JEE Advanced. Tutoring for 3 years.', appliedAt: new Date(now - 4 * HOUR) }],
      updates: [{ userId: ids.sneha, message: 'Session 1 completed! Covered all of Mechanics. Student is doing great.', createdAt: new Date(now - DAY) }] }),
    task({ _id: t.t4, title: 'Edit YouTube Video — 15 Minute Tech Review', category: 'video', subfield: 'YouTube Videos', budget: 350, experienceLevel: 'intermediate', urgent: true,
      description: 'Need a 15-minute tech review video edited professionally. Raw footage provided. Colour grading, transitions, lower thirds, music and thumbnail.',
      deadline: new Date(now + 2 * DAY), creatorId: ids.arjun, createdAt: new Date(now - 6 * HOUR) }),
    task({ _id: t.t5, title: 'Python ML Script for Data Analysis', category: 'coding', subfield: 'ML/AI', budget: 1200, experienceLevel: 'expert',
      description: 'I have a CSV dataset (~5000 rows) and need a Python script to clean data, perform EDA, train a Random Forest classifier and generate a report with visualisations.',
      deadline: new Date(now + 7 * DAY), creatorId: ids.sneha, createdAt: new Date(now - 2 * HOUR) }),
    task({ _id: t.t6, title: 'Handwritten Chemistry Notes (12th Grade)', category: 'notes', subfield: 'Science', budget: 250, status: 'completed', approved: true,
      description: 'Need comprehensive, neat handwritten notes for the 12th grade Chemistry syllabus. NCERT-based with reactions, mechanisms and summary boxes. Scanned PDF.',
      deadline: new Date(now + 10 * DAY), creatorId: ids.dev, selectedApplicantId: ids.sneha, escrowAmount: 250, completedAt: new Date(now - DAY), createdAt: new Date(now - 15 * DAY),
      applicants: [{ userId: ids.sneha, commitment: 'full', bid: 250, message: 'I can prepare excellent notes with diagrams and summaries.', appliedAt: new Date(now - 14 * DAY) }] }),
    task({ _id: t.t7, title: 'Social Media Content Pack (Instagram 30 Posts)', category: 'copywriting', subfield: 'Social Media', budget: 500, teamSize: 2,
      description: 'Need 30 Instagram posts (captions + image prompts) for a student fashion brand. Gen Z, trendy, minimalist. Include 10 reel scripts in a Google Doc.',
      deadline: new Date(now + 6 * DAY), creatorId: ids.rahul, createdAt: new Date(now - DAY),
      applicants: [{ userId: ids.dev, commitment: 'full', bid: 450, message: 'I run social media for 3 brands already. Very familiar with Gen Z aesthetic!', appliedAt: new Date(now - HOUR) }] }),
    task({ _id: t.t8, title: 'UI Design for Student App Screens (Figma)', category: 'design', subfield: 'UI/UX', budget: 900, experienceLevel: 'intermediate',
      description: 'Design 8 screens in Figma for a student productivity app: Login, Dashboard, Calendar, Task Manager, Notes, Settings. Dark mode preferred.',
      deadline: new Date(now + 8 * DAY), creatorId: ids.arjun, createdAt: new Date(now - 4 * HOUR) }),
    task({ _id: t.t9, title: 'College Fest Promo Reel (60 seconds)', category: 'video', subfield: 'Reels / Shorts', budget: 300, status: 'cancelled',
      description: 'A punchy 60-second promo reel for our college cultural fest using provided clips, with beat-synced cuts and animated text overlays.',
      deadline: new Date(now + 4 * DAY), creatorId: ids.dev, selectedApplicantId: ids.rahul, escrowAmount: 300, cancelled: true, cancelledBy: 'client',
      cancellationReason: 'Fest got postponed — work was about half done.', disputeResolved: false, createdAt: new Date(now - 4 * DAY),
      applicants: [{ userId: ids.rahul, commitment: 'full', bid: 300, message: 'Reels are my speciality, I can turn this around in 2 days.', appliedAt: new Date(now - 4 * DAY) }],
      updates: [{ userId: ids.rahul, message: 'First draft of the intro and transitions is ready — sharing preview link.', createdAt: new Date(now - 2 * DAY) }] }),
  ]);

  await Review.create({ taskId: t.t6, fromUserId: ids.dev, toUserId: ids.sneha, rating: 5,
    feedback: 'Sneha prepared absolutely brilliant notes! Well-organised, neat, and included extra tips. Will hire again!' });

  await Transaction.insertMany([
    ...users.map((u) => ({ userId: u._id, type: 'topup', amount: 5000, note: 'Welcome credits', createdAt: new Date(now - 30 * DAY) })),
    { userId: ids.rahul, taskId: t.t3, type: 'escrow_hold', amount: 600, note: 'Funds locked in escrow' },
    { userId: ids.dev, taskId: t.t6, type: 'escrow_hold', amount: 250, note: 'Funds locked in escrow' },
    { userId: ids.sneha, taskId: t.t6, type: 'escrow_release', amount: 225, note: 'Payout (₹250 − 10% fee)' },
    { userId: null, taskId: t.t6, type: 'platform_fee', amount: 25, note: 'GigHub commission' },
    { userId: ids.dev, taskId: t.t9, type: 'escrow_hold', amount: 300, note: 'Funds locked in escrow' },
  ]);

  await Notification.insertMany([
    { userId: ids.priya, type: 'application', message: 'New applicant for "Build a Portfolio Website in React"', taskId: t.t1 },
    { userId: ids.sneha, type: 'selected', message: '🎉 You were selected for "Physics Tutor for JEE Preparation"!', taskId: t.t3 },
    { userId: ids.arjun, type: 'application', message: 'New applicant for "Design a Logo for Student Startup"', taskId: t.t2 },
  ]);

  console.log('✔ Seeded 5 users, 9 tasks, ledger, reviews & notifications.');
  console.log('  Login with any of: arjun@student.edu (admin), priya@, rahul@, sneha@, dev@student.edu — password: "password"');
  await disconnectDB();
}

run().catch(async (err) => {
  console.error('Seed failed:', err);
  await disconnectDB().catch(() => {});
  process.exit(1);
});

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // Stage 1: 100 concurrent users
    { duration: '1m',  target: 100 },   // Hold at 100
    { duration: '30s', target: 500 },   // Stage 2: 500 concurrent users
    { duration: '1m',  target: 500 },   // Hold at 500
    { duration: '1m',  target: 1000 },  // Stage 3: 1000 concurrent users
    { duration: '2m',  target: 1000 },  // Hold at 1000
    { duration: '2m',  target: 5000 },  // Stage 4: 5000 concurrent users (distributed)
    { duration: '2m',  target: 5000 },  // Stress at 5000
    { duration: '1m',  target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],     // Error rate should stay under 5%
    http_req_duration: ['p(95)<3000'],  // 95% of requests should be below 3s
  },
};

const BASE_URL = 'https://careerverse-ai-gold.vercel.app';

export default function () {
  const rand = Math.random();

  if (rand < 0.5) {
    // Journey 1: Candidate Discovery & Job Search
    let res = http.get(`${BASE_URL}/`);
    check(res, { 'homepage 200': (r) => r.status === 200 });
    sleep(1 + Math.random());

    res = http.get(`${BASE_URL}/jobs`);
    check(res, { 'jobs 200': (r) => r.status === 200 });
    sleep(1 + Math.random());

    res = http.get(`${BASE_URL}/api/opportunities`);
    check(res, { 'api opportunities 200': (r) => r.status === 200 });
    sleep(0.5);

    res = http.get(`${BASE_URL}/internships`);
    check(res, { 'internships 200': (r) => r.status === 200 });
    sleep(1);

    res = http.get(`${BASE_URL}/create-resume`);
    check(res, { 'resume builder 200': (r) => r.status === 200 });
    sleep(2);
  } else if (rand < 0.8) {
    // Journey 2: Event & Community Explorer
    let res = http.get(`${BASE_URL}/`);
    check(res, { 'homepage 200': (r) => r.status === 200 });
    sleep(1);

    res = http.get(`${BASE_URL}/events`);
    check(res, { 'events 200': (r) => r.status === 200 });
    sleep(1.5);

    res = http.get(`${BASE_URL}/api/events`);
    check(res, { 'api events 200': (r) => r.status === 200 });
    sleep(0.5);

    res = http.get(`${BASE_URL}/api/search?q=intern`);
    check(res, { 'api search 200': (r) => r.status === 200 });
    sleep(1);
  } else {
    // Journey 3: Recruiter Talent Sourcing
    let res = http.get(`${BASE_URL}/`);
    check(res, { 'homepage 200': (r) => r.status === 200 });
    sleep(1);

    res = http.get(`${BASE_URL}/api/opportunities`);
    check(res, { 'api opportunities 200': (r) => r.status === 200 });
    sleep(0.5);

    res = http.get(`${BASE_URL}/api/search?q=developer`);
    check(res, { 'search developer 200': (r) => r.status === 200 });
    sleep(1.5);
  }
}

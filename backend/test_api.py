import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

BASE = 'http://127.0.0.1:8000'

ADMIN_EMAIL = os.getenv('ADMIN_EMAIL')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD')

JOHN_EMAIL = os.getenv('DEMO_USER1_EMAIL')
JOHN_PASSWORD = os.getenv('DEMO_USER1_PASSWORD')

ALICE_EMAIL = os.getenv('DEMO_USER2_EMAIL')
ALICE_PASSWORD = os.getenv('DEMO_USER2_PASSWORD')
def run_tests():
    # 1. Health check
    h = requests.get(f'{BASE}/api/health').json()
    print('[TEST 1] Health:', h)
    assert h['status'] == 'healthy'

    # 2. Login as Admin
    r_admin = requests.post(
        f'{BASE}/api/auth/login',
        json={
            'email': ADMIN_EMAIL,
            'password': ADMIN_PASSWORD
        }
    )   
    print('[TEST 2] Admin login status:', r_admin.status_code)
    assert r_admin.status_code == 200
    admin_token = r_admin.json()['token']
    assert r_admin.json()['user']['role'] == 'admin'

    # 3. Login as Employee John Doe
    r_john = requests.post(
        f'{BASE}/api/auth/login',
        json={
            'email': JOHN_EMAIL,
            'password': JOHN_PASSWORD
        }
    )

    print('[TEST 3] John Doe login status:', r_john.status_code)
    assert r_john.status_code == 200
    john_token = r_john.json()['token']
    assert r_john.json()['user']['role'] == 'user'

    # 4. Clear database with admin credentials to ensure fresh state
    r_clear = requests.post(f'{BASE}/api/tickets/clear', headers={'Authorization': f'Bearer {admin_token}'})
    print('[TEST 4] Clear database:', r_clear.json())
    assert r_clear.json()['success'] is True

    # 5. Empty ticket validation
    r_empty = requests.post(f'{BASE}/api/tickets/analyze',
        headers={'Authorization': f'Bearer {john_token}'},
        json={'description': '   '})
    print('[TEST 5] Empty ticket status:', r_empty.status_code, 'detail:', r_empty.json())
    assert r_empty.status_code == 400
    assert 'Please describe your IT issue' in r_empty.json()['detail']

    # 6. Verify load demo endpoint is removed (should return 404 or 405)
    r_demo = requests.post(f'{BASE}/api/demo/load')
    print('[TEST 6] Demo load endpoint removed status:', r_demo.status_code)
    assert r_demo.status_code in [404, 405]

    # 7. John Doe submits a live ticket
    r_john_ticket = requests.post(f'{BASE}/api/tickets/analyze',
        headers={'Authorization': f'Bearer {john_token}'},
        json={'description': 'I forgot my laptop password and cannot login.'})
    print('[TEST 7] John ticket created:', r_john_ticket.status_code, r_john_ticket.json()['ticket_id'])
    assert r_john_ticket.status_code == 200
    assert r_john_ticket.json()['user_email'] == 'john.doe@company.com'

    # 8. John views his tickets -> should see 1 ticket
    john_tickets = requests.get(f'{BASE}/api/tickets', headers={'Authorization': f'Bearer {john_token}'}).json()
    print(f'[TEST 8] John tickets count: {len(john_tickets)}')
    assert len(john_tickets) == 1
    assert john_tickets[0]['user_email'] == 'john.doe@company.com'

    # 9. Alice logs in and views tickets -> should see 0 tickets (isolation!)
    r_alice = requests.post(
        f'{BASE}/api/auth/login',
        json={
            'email': ALICE_EMAIL,
            'password': ALICE_PASSWORD
        }
    )

    alice_token = r_alice.json()['token']
    alice_tickets = requests.get(f'{BASE}/api/tickets', headers={'Authorization': f'Bearer {alice_token}'}).json()
    print(f'[TEST 9] Alice tickets count: {len(alice_tickets)} (isolated from John)')
    assert len(alice_tickets) == 0

    # 10. Admin views all tickets -> sees John's ticket with requester info
    admin_tickets = requests.get(f'{BASE}/api/tickets', headers={'Authorization': f'Bearer {admin_token}'}).json()
    print(f'[TEST 10] Admin all tickets count: {len(admin_tickets)}')
    assert len(admin_tickets) == 1
    print('Admin sees requester:', admin_tickets[0]['user_name'], admin_tickets[0]['user_email'])

    # 11. Admin approves John's ticket
    tid = admin_tickets[0]['ticket_id']
    r_app = requests.post(f'{BASE}/api/tickets/{tid}/approve', headers={'Authorization': f'Bearer {admin_token}'})
    print(f'[TEST 11] Admin approved ticket {tid}: status is {r_app.json()["status"]}')
    assert r_app.json()['status'] == 'Resolved'

    # 12. John checks his ticket status -> now Resolved!
    john_updated = requests.get(f'{BASE}/api/tickets/{tid}', headers={'Authorization': f'Bearer {john_token}'}).json()
    print(f'[TEST 12] John sees updated status: {john_updated["status"]}')
    assert john_updated['status'] == 'Resolved'

    # 13. Audit Log (Admin access verified)
    r_audit = requests.get(f'{BASE}/api/audit-log', headers={'Authorization': f'Bearer {admin_token}'})
    logs = r_audit.json()
    print(f'[TEST 13] Admin audit logs count: {len(logs)}')
    assert len(logs) > 0

    # 14. Regular user blocked from audit log
    r_audit_blocked = requests.get(f'{BASE}/api/audit-log', headers={'Authorization': f'Bearer {john_token}'})
    print(f'[TEST 14] User blocked from audit log status:', r_audit_blocked.status_code)
    assert r_audit_blocked.status_code == 403

    print('\n>>> ALL 14 AUTHENTICATION & MULTI-PORTAL TESTS PASSED! <<<')

if __name__ == '__main__':
    run_tests()
